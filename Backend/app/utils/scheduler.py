import os
import asyncio
import requests
from datetime import datetime
import pytz
from supabase import create_client

from app.llm_client import analyze_source_with_llm
from app.utils.repo import clone_repo, find_src_dir, read_source_files
from app.utils.mails import (
    send_application_received_email,
    send_shortlist_email,
    send_rejection_email,
    send_interview_confirmation_email,
    send_project_submission_email,
    send_interview_scheduling_email,
    send_interview_link_email,
)

async def send_pending_application_received_emails():
    """Send application received emails for new applications"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        now = datetime.now(pytz.UTC)

        # Fetch applications where application received email not sent yet
        applications = supabase.table("job_applications").select(
            "id, candidate_id, job_id, app_users!job_applications_candidate_id_fkey(email)"
        ).filter("application_received_email_sent", "eq", False).execute()

        sent_count = 0
        failed_count = 0

        for app in applications.data:
            try:
                candidate_email = app.get("app_users", {}).get("email") if app.get("app_users") else None

                if not candidate_email:
                    failed_count += 1
                    continue

                # Get job details
                job = supabase.table("recruiter_job_openings").select(
                    "role_title, recruiter_id"
                ).eq("id", app["job_id"]).single().execute()

                if not job.data:
                    failed_count += 1
                    continue

                # Get company info
                company = supabase.table("recruiter_profiles").select(
                    "company_name"
                ).eq("user_id", job.data["recruiter_id"]).execute()

                company_name = "Our Company"
                if company.data and len(company.data) > 0:
                    company_name = company.data[0].get("company_name", "Our Company")

                job_title = job.data.get("role_title", "Position")

                # Send email
                if send_application_received_email(candidate_email, job_title, company_name):
                    sent_count += 1
                else:
                    failed_count += 1

                # Mark as sent
                supabase.table("job_applications").update(
                    {
                        "application_received_email_sent": True,
                        "application_received_email_sent_at": now.isoformat(),
                    }
                ).eq("id", app["id"]).execute()

            except Exception as e:
                print(f"❌ Error processing application {app.get('id')}: {str(e)}")
                failed_count += 1

        print(f"✓ Application received emails: {sent_count} sent, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_application_received_emails: {str(e)}")


async def send_pending_shortlist_emails():
    """Send shortlist/rejection emails after resume analysis"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        now = datetime.now(pytz.UTC)

        # Fetch applications where email not sent yet
        applications = supabase.table("job_applications").select(
            "id, candidate_id, match_score, job_id, app_users!job_applications_candidate_id_fkey(email)"
        ).filter("resume_shortlist_email_sent", "eq", False).execute()

        shortlist_count = 0
        rejection_count = 0
        failed_count = 0

        for app in applications.data:
            try:
                candidate_email = app.get("app_users", {}).get("email") if app.get("app_users") else None

                if not candidate_email:
                    failed_count += 1
                    continue

                # Get job details with recruiter info
                job = supabase.table("recruiter_job_openings").select(
                    "role_title, screening_start_date, has_project_assignment, recruiter_id"
                ).eq("id", app["job_id"]).single().execute()

                if not job.data:
                    failed_count += 1
                    continue

                # Get recruiter's company info
                company = supabase.table("recruiter_profiles").select(
                    "company_name"
                ).eq("user_id", job.data["recruiter_id"]).execute()

                company_name = "Our Company"
                if company.data and len(company.data) > 0:
                    company_name = company.data[0].get("company_name", "Our Company")

                # Parse screening_start_date
                screening_start = datetime.fromisoformat(
                    job.data["screening_start_date"].replace("Z", "+00:00")
                )

                # Only send if screening has started
                if now < screening_start:
                    continue

                match_score = app.get("match_score", 0)
                job_title = job.data.get("role_title", "Position")
                has_project = job.data.get("has_project_assignment", False)

                # Send appropriate email
                if match_score >= 60:
                    if has_project:
                        next_link = f"{FRONTEND_URL}/project?app_id={app['id']}&job_id={app['job_id']}"
                    else:
                        next_link = f"{FRONTEND_URL}/interview-scheduler?app_id={app['id']}&job_id={app['job_id']}"

                    if send_shortlist_email(candidate_email, job_title, next_link, company_name, has_project):
                        shortlist_count += 1
                    else:
                        failed_count += 1
                else:
                    if send_rejection_email(candidate_email, job_title):
                        rejection_count += 1
                    else:
                        failed_count += 1

                # Mark as sent
                supabase.table("job_applications").update(
                    {
                        "resume_shortlist_email_sent": True,
                        "resume_shortlist_email_sent_at": now.isoformat(),
                    }
                ).eq("id", app["id"]).execute()

            except Exception as e:
                print(f"❌ Error processing application {app.get('id')}: {str(e)}")
                failed_count += 1

        print(f"✓ Shortlist emails: {shortlist_count} sent, {rejection_count} rejections, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_shortlist_emails: {str(e)}")


async def send_pending_interview_confirmation_emails():
    """Send interview confirmation emails after interview is scheduled"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        now = datetime.now(pytz.UTC)

        # Fetch applications where interview confirmation email not sent yet but interview is scheduled
        applications = supabase.table("job_applications").select(
            "id, candidate_id, job_id, interview_scheduled_date, app_users!job_applications_candidate_id_fkey(email)"
        ).filter("interview_confirmation_email_sent", "eq", False).filter(
            "interview_scheduled_date", "not.is", "null"
        ).execute()

        sent_count = 0
        failed_count = 0

        for app in applications.data:
            try:
                candidate_email = app.get("app_users", {}).get("email") if app.get("app_users") else None

                if not candidate_email:
                    failed_count += 1
                    continue

                # Get job details
                job = supabase.table("recruiter_job_openings").select(
                    "role_title, recruiter_id"
                ).eq("id", app["job_id"]).single().execute()

                if not job.data:
                    failed_count += 1
                    continue

                # Get company info
                company = supabase.table("recruiter_profiles").select(
                    "company_name"
                ).eq("user_id", job.data["recruiter_id"]).execute()

                company_name = "Our Company"
                if company.data and len(company.data) > 0:
                    company_name = company.data[0].get("company_name", "Our Company")

                job_title = job.data.get("role_title", "Position")

                # Parse scheduled datetime
                scheduled_dt = app.get("interview_scheduled_date")
                scheduled_date = scheduled_dt.split("T")[0] if "T" in scheduled_dt else scheduled_dt
                scheduled_time = scheduled_dt.split("T")[1][:5] if "T" in scheduled_dt else "10:00"

                # Send email
                if send_interview_confirmation_email(candidate_email, job_title, company_name, scheduled_date, scheduled_time):
                    sent_count += 1
                else:
                    failed_count += 1

                # Mark as sent
                supabase.table("job_applications").update(
                    {
                        "interview_confirmation_email_sent": True,
                        "interview_confirmation_email_sent_at": now.isoformat(),
                    }
                ).eq("id", app["id"]).execute()

            except Exception as e:
                print(f"❌ Error processing application {app.get('id')}: {str(e)}")
                failed_count += 1

        print(f"✓ Interview confirmation emails: {sent_count} sent, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_interview_confirmation_emails: {str(e)}")


async def send_pending_project_submission_emails():
    """If project_submitted=true and repo_mail_sended=false, send email then mark true."""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(supabase_url, supabase_key)
        now = datetime.now(pytz.UTC)

        applications = (
            supabase.table("job_applications")
            .select("id, job_id, project_submitted, repo_mail_sended, app_users!job_applications_candidate_id_fkey(email)")
            .filter("project_submitted", "eq", True)
            .filter("repo_mail_sended", "eq", False)
            .execute()
        )

        sent_count = 0
        failed_count = 0

        for app in applications.data or []:
            try:
                candidate_email = (app.get("app_users") or {}).get("email")
                if not candidate_email:
                    failed_count += 1
                    continue

                job = (
                    supabase.table("recruiter_job_openings")
                    .select("role_title, recruiter_id")
                    .eq("id", app["job_id"])
                    .single()
                    .execute()
                )
                if not job.data:
                    failed_count += 1
                    continue

                company = (
                    supabase.table("recruiter_profiles")
                    .select("company_name")
                    .eq("user_id", job.data["recruiter_id"])
                    .execute()
                )
                company_name = "Our Company"
                if company.data:
                    company_name = company.data[0].get("company_name") or "Our Company"

                job_title = job.data.get("role_title") or "Position"

                if send_project_submission_email(candidate_email, job_title, company_name):
                    (
                        supabase.table("job_applications")
                        .update(
                            {
                                "repo_mail_sended": True,
                                "repo_mail_sended_at": now.isoformat(),
                            }
                        )
                        .eq("id", app["id"])
                        .execute()
                    )
                    sent_count += 1
                else:
                    failed_count += 1

            except Exception as e:
                print(f"❌ Repo mail failed for application {app.get('id')}: {e}")
                failed_count += 1

        print(f"✓ Repo submission emails: {sent_count} sent, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_project_submission_emails: {e}")


async def send_pending_project_analysis():
    """
    If project_submitted=true and project_analysis_completed=false:
    clone repo, send source + recruiter_job_openings.project_description to LLM,
    then update job_applications.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(supabase_url, supabase_key)

        applications = (
            supabase.table("job_applications")
            .select("id, job_id, project_repository_link, project_description, project_submitted, project_analysis_completed")
            .filter("project_submitted", "eq", True)
            .filter("project_analysis_completed", "eq", False)
            .execute()
        )

        if not applications.data:
            return

        analyzed_count = 0
        failed_count = 0

        import tempfile

        for app in applications.data:
            try:
                app_id = app.get("id")
                job_id = app.get("job_id")
                repo_link = (app.get("project_repository_link") or "").strip()
                candidate_project_desc = (app.get("project_description") or "").strip()

                if not repo_link or not job_id:
                    failed_count += 1
                    continue

                # Use recruiter job opening project_description as requested
                job = (
                    supabase.table("recruiter_job_openings")
                    .select("project_description")
                    .eq("id", job_id)
                    .single()
                    .execute()
                )

                job_project_desc = ""
                if job.data:
                    job_project_desc = (job.data.get("project_description") or "").strip()

                llm_project_desc = job_project_desc or candidate_project_desc or "No project description provided."

                print(f"Analyzing project for app {app_id}: {repo_link}")

                with tempfile.TemporaryDirectory() as tmpdir:
                    repo_path = clone_repo(repo_link, tmpdir)
                    src_path = find_src_dir(repo_path)
                    combined_source = read_source_files(src_path)

                    result = await analyze_source_with_llm(
                        source=combined_source,
                        project_desc=llm_project_desc,
                    )

                update_payload = {
                    "project_analysis_completed": True,
                    "project_description_analyzed": result.get("description"),
                    "project_features": result.get("features") or [],
                    "project_tech_stack": result.get("tech_stack") or [],
                    "project_interview_questions": result.get("questions_that_can_be_asked_in_interview") or [],
                    "project_summary": result.get("summary"),
                    "project_alignment_score": result.get("alignment_score") or 0,
                    "project_alignment_summary": result.get("alignment_summary"),
                }

                r = requests.patch(
                    f"{supabase_url}/rest/v1/job_applications?id=eq.{app_id}",
                    headers={
                        "apikey": supabase_key,
                        "Authorization": f"Bearer {supabase_key}",
                        "Content-Type": "application/json",
                    },
                    json=update_payload,
                    timeout=30,
                )

                if r.status_code >= 300:
                    print(f"❌ Failed to update app {app_id}: {r.text}")
                    failed_count += 1
                else:
                    analyzed_count += 1
                    print(f"✓ Project analyzed for app {app_id}")

            except Exception as e:
                print(f"❌ Project analysis failed for app {app.get('id')}: {e}")
                failed_count += 1

        print(f"✓ Project analysis: {analyzed_count} completed, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_project_analysis: {e}")


async def send_pending_alignment_score_emails():
    """
    Check project_alignment_score after analysis:
    - If project_analysis_completed=true AND interview_confirmation_email_sent=false:
      - If alignment_score > 75%: Send interview scheduling email
      - If alignment_score <= 75%: Send rejection email
    """
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")  # ✅ ADD THIS LINE

    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        return

    try:
        supabase = create_client(supabase_url, supabase_key)
        now = datetime.now(pytz.UTC)

        # Fetch applications where project analysis is completed but email not sent yet
        applications = (
            supabase.table("job_applications")
            .select(
                "id, job_id, project_alignment_score, project_analysis_completed, "
                "app_users!job_applications_candidate_id_fkey(email)"
            )
            .filter("project_analysis_completed", "eq", True)
            .filter("interview_confirmation_email_sent", "eq", False)
            .execute()
        )

        approved_count = 0
        rejected_count = 0
        failed_count = 0

        for app in applications.data or []:
            try:
                candidate_email = (app.get("app_users") or {}).get("email")
                if not candidate_email:
                    failed_count += 1
                    continue

                alignment_score = app.get("project_alignment_score") or 0
                app_id = app.get("id")
                job_id = app.get("job_id")

                # Get job details
                job = (
                    supabase.table("recruiter_job_openings")
                    .select("role_title, recruiter_id, screening_start_date")
                    .eq("id", job_id)
                    .single()
                    .execute()
                )
                if not job.data:
                    failed_count += 1
                    continue

                # Get company info
                company = (
                    supabase.table("recruiter_profiles")
                    .select("company_name")
                    .eq("user_id", job.data["recruiter_id"])
                    .execute()
                )
                company_name = "Our Company"
                if company.data:
                    company_name = company.data[0].get("company_name") or "Our Company"

                job_title = job.data.get("role_title") or "Position"
                screening_date = job.data.get("screening_start_date", "").split("T")[0] if job.data.get("screening_start_date") else "TBD"
                screening_time = "10:00"

                # ALIGNMENT SCORE > 75%: SEND INTERVIEW SCHEDULING EMAIL
                if alignment_score > 75:
                    # Create scheduling link for candidate to schedule their interview
                    scheduling_link = f"{FRONTEND_URL}/interview-scheduler?app_id={app_id}&job_id={job_id}"
                    
                    if send_interview_scheduling_email(
                        candidate_email, job_title, company_name, scheduling_link
                    ):
                        supabase.table("job_applications").update(
                            {
                                "interview_confirmation_email_sent": True,
                                "interview_confirmation_email_sent_at": now.isoformat(),
                            }
                        ).eq("id", app_id).execute()

                        approved_count += 1
                        print(f"✓ Interview scheduling email sent for app {app_id} (alignment score: {alignment_score}%)")
                    else:
                        failed_count += 1

                # ALIGNMENT SCORE <= 75%: SEND REJECTION
                else:
                    if send_rejection_email(candidate_email, job_title):
                        supabase.table("job_applications").update(
                            {
                                "interview_confirmation_email_sent": True,  # Mark as processed
                                "interview_confirmation_email_sent_at": now.isoformat(),
                            }
                        ).eq("id", app_id).execute()

                        rejected_count += 1
                        print(f"✓ Rejection email sent for app {app_id} (alignment score: {alignment_score}%)")
                    else:
                        failed_count += 1

            except Exception as e:
                print(f"❌ Alignment score email failed for app {app.get('id')}: {e}")
                failed_count += 1

        print(f"✓ Alignment score emails: {approved_count} approved, {rejected_count} rejected, {failed_count} failed")

    except Exception as e:
        print(f"❌ Error in send_pending_alignment_score_emails: {e}")


async def send_pending_interview_links():
    """Send interview link when interview is scheduled and link not sent yet"""
    from app.utils.mails import send_interview_link_email
    
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        
        # Find applications where interview is scheduled but link not sent
        applications = supabase.table("job_applications").select(
            "id, candidate_id, job_id, interview_scheduled_date, app_users!job_applications_candidate_id_fkey(email)"
        ).filter(
            "interview_link_sent", "eq", False
        ).filter(
            "interview_scheduled_date", "not.is", "null"
        ).execute()

        for app in applications.data:
            candidate_email = app.get("app_users", {}).get("email") if app.get("app_users") else None
            if not candidate_email:
                continue

            job = supabase.table("recruiter_job_openings").select("role_title, recruiter_id").eq("id", app["job_id"]).single().execute()
            if not job.data:
                continue
                
            company = supabase.table("recruiter_profiles").select("company_name").eq("user_id", job.data["recruiter_id"]).execute()
            company_name = company.data[0].get("company_name", "Our Company") if company.data and len(company.data) > 0 else "Our Company"
            job_title = job.data.get("role_title", "Position")

            # Generate the unique interview tester link
            interview_link = f"{FRONTEND_URL}/interview-tester?app_id={app['id']}&job_id={app['job_id']}"
            
            if send_interview_link_email(candidate_email, job_title, company_name, interview_link):
                # Update database flag
                supabase.table("job_applications").update({
                    "interview_link_sent": True
                }).eq("id", app["id"]).execute()
                print(f"✓ Interview link sent to {candidate_email}")

    except Exception as e:
        print(f"❌ Error in send_pending_interview_links: {str(e)}")


def email_scheduler_job():
    """Wrapper to run async functions in a separate event loop"""
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        # Run all email and analysis jobs
        loop.run_until_complete(send_pending_project_analysis())
        loop.run_until_complete(send_pending_alignment_score_emails())
        loop.run_until_complete(send_pending_application_received_emails())
        loop.run_until_complete(send_pending_shortlist_emails())
        loop.run_until_complete(send_pending_interview_confirmation_emails())
        loop.run_until_complete(send_pending_interview_links())
        
        loop.close()
    except Exception as e:
        print(f"❌ Scheduler error: {str(e)}")
        import traceback
        traceback.print_exc()