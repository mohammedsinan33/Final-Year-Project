import os
from datetime import datetime
import pytz
from supabase import create_client
from app.utils.mails import (
    send_application_received_email,
    send_shortlist_email,
    send_rejection_email,
    send_interview_confirmation_email,
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
            "interview_scheduled_date", "is.not", "null"
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