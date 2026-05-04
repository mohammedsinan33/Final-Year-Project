import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from supabase import create_client
from datetime import datetime
import pytz


def send_shortlist_email(candidate_email, job_title, next_level_link, company_name, has_project):
    """Send shortlist notification email to candidate"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            print("EMAIL_PASSWORD not configured")
            return False
        
        subject = f"Congratulations! You're Selected for the Next Round - {job_title}"
        
        # Dynamic content based on project assignment
        next_step_text = "Project Details" if has_project else "Interview"
        next_step_description = (
            "You have been selected to complete a project assignment as part of our evaluation process."
            if has_project
            else "You have been selected to proceed to the interview round. We look forward to learning more about you!"
        )
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">🎉 Congratulations!</h2>
                    
                    <p>Greetings from <strong>{company_name}</strong>!</p>
                    
                    <p>We are pleased to inform you that you have been <strong>selected for the next round</strong> of our recruitment process for the position of:</p>
                    <h3 style="color: #2196F3;">{job_title}</h3>
                    
                    <p>{next_step_description}</p>
                    
                    <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                        <p style="margin: 0;">Click the button below to proceed:</p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{next_level_link}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                            Go to {next_step_text} →
                        </a>
                    </div>
                    
                    <p>If the button doesn't work, copy this link:</p>
                    <p style="word-break: break-all; color: #666; font-size: 12px;">
                        <a href="{next_level_link}" style="color: #2196F3;">{next_level_link}</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>Thank you for your interest in {company_name}. We're excited to see what you can bring to our team!</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please don't reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        print(f"Connecting to Gmail SMTP for {candidate_email}...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Email sent successfully to {candidate_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print(f"❌ Email authentication failed. Check SENDER_EMAIL and EMAIL_PASSWORD")
        return False
    except smtplib.SMTPException as e:
        print(f"❌ SMTP error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Email send failed: {str(e)}")
        return False

def send_rejection_email(candidate_email, job_title):
    """Send rejection notification email"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
        
        subject = f"Application Status - {job_title}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>Application Update</h2>
                    
                    <p>Thank you for applying for the position of <strong>{job_title}</strong>.</p>
                    
                    <p>We appreciate your interest and the time you spent on your application. 
                    However, we have decided to move forward with other candidates whose qualifications 
                    more closely match the current requirements.</p>
                    
                    <p>We encourage you to apply for future opportunities that match your skills and experience.</p>
                    
                    <p>Best regards,<br>The Hiring Team</p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Rejection email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Rejection email failed: {str(e)}")
        return False

def send_application_received_email(candidate_email, job_title, company_name):
    """Send application received confirmation email"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
        
        subject = f"Application Received - {job_title}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2196F3;">📨 Application Received</h2>
                    
                    <p>Dear Candidate,</p>
                    
                    <p>Thank you for applying to <strong>{company_name}</strong> for the position of <strong>{job_title}</strong>.</p>
                    
                    <p>We have successfully received your application and resume. Our team is currently reviewing your qualifications and we will get back to you shortly with an update on your application status.</p>
                    
                    <div style="background-color: #e3f2fd; padding: 15px; border-left: 4px solid #2196F3; margin: 20px 0;">
                        <p style="margin: 0; font-size: 14px;"><strong>Application Status:</strong> Under Review</p>
                    </div>
                    
                    <p>We appreciate your patience and interest in joining our team. Stay tuned!</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>Best regards,<br><strong>{company_name}</strong> Team</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please don't reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Application received email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Application received email failed: {str(e)}")
        return False

def send_interview_confirmation_email(candidate_email, job_title, company_name, scheduled_date, scheduled_time):
    """Send interview scheduled confirmation email"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
        
        subject = f"Interview Confirmed - {job_title}"
        
        # Format the date and time nicely
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(f"{scheduled_date}T{scheduled_time}:00")
            formatted_time = dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            formatted_time = f"{scheduled_date} at {scheduled_time}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">✓ Interview Scheduled</h2>
                    
                    <p>Dear Candidate,</p>
                    
                    <p>Great news! Your interview has been scheduled. Here are your interview details:</p>
                    
                    <div style="background-color: #f1f8e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 10px 0;"><strong>Position:</strong> {job_title}</p>
                        <p style="margin: 10px 0;"><strong>Company:</strong> {company_name}</p>
                        <p style="margin: 10px 0;"><strong>Scheduled Date & Time:</strong> {formatted_time}</p>
                        <p style="margin: 10px 0;"><strong>Interview Format:</strong> Video Call</p>
                        <p style="margin: 10px 0;"><strong>Duration:</strong> Approximately 30-45 minutes</p>
                    </div>
                    
                    <p><strong>What to prepare:</strong></p>
                    <ul style="color: #555;">
                        <li>Ensure you have a stable internet connection</li>
                        <li>Test your camera and microphone beforehand</li>
                        <li>Find a quiet, professional environment</li>
                        <li>Have your resume and relevant documents ready</li>
                    </ul>
                    
                    <p>If you need to reschedule or have any questions, please contact us as soon as possible.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>We look forward to speaking with you!</p>
                    <p style="color: #666;">Best regards,<br><strong>{company_name}</strong> Team</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please don't reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Interview confirmation email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Interview confirmation email failed: {str(e)}")
        return False


def send_project_submission_email(candidate_email, job_title, company_name):
    """Send project submission confirmation email"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
        
        subject = f"Project Received - {job_title}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">✓ Project Successfully Uploaded</h2>
                    
                    <p>Dear Candidate,</p>
                    
                    <p>Congratulations! We have successfully received your project submission for the <strong>{job_title}</strong> position at <strong>{company_name}</strong>.</p>
                    
                    <div style="background-color: #f1f8e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 10px 0;"><strong>Status:</strong> Under Review</p>
                        <p style="margin: 10px 0;"><strong>Position:</strong> {job_title}</p>
                        <p style="margin: 10px 0;"><strong>Company:</strong> {company_name}</p>
                    </div>
                    
                    <p>Our team is now carefully reviewing your project submission. We will evaluate:</p>
                    <ul style="color: #555;">
                        <li>Code quality and architecture</li>
                        <li>Problem-solving approach</li>
                        <li>Implementation completeness</li>
                        <li>Documentation and clarity</li>
                    </ul>
                    
                    <p>We will get back to you with the evaluation results within the next few days. Thank you for your time and effort!</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>Best regards,<br><strong>{company_name}</strong> Recruitment Team</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please don't reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Project submission email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Project submission email failed: {str(e)}")
        return False


def send_interview_scheduling_email(candidate_email, job_title, company_name, scheduling_link):
    """Send email asking candidate to schedule their interview"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
        
        subject = f"Schedule Your Interview - {job_title}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">🎉 Great News!</h2>
                    
                    <p>Dear Candidate,</p>
                    
                    <p>We are pleased to inform you that you have been <strong>selected for an interview</strong> for the position of:</p>
                    <h3 style="color: #2196F3;">{job_title}</h3>
                    <p style="color: #666;">at <strong>{company_name}</strong></p>
                    
                    <p>Your project submission was excellent! Now we'd like to move forward with a video interview to learn more about you.</p>
                    
                    <div style="background-color: #e8f5e9; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0; font-size: 16px;"><strong>Please schedule your interview at your convenience:</strong></p>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{scheduling_link}" style="background-color: #4CAF50; color: white; padding: 14px 32px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                            Schedule Your Interview →
                        </a>
                    </div>
                    
                    <p style="color: #666;">Or copy this link:</p>
                    <p style="word-break: break-all; color: #2196F3; font-size: 12px;">
                        <a href="{scheduling_link}" style="color: #2196F3;">{scheduling_link}</a>
                    </p>
                    
                    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px;">
                        <p style="margin: 0;"><strong>What to expect:</strong></p>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Video call interview (approximately 30-45 minutes)</li>
                            <li>Discussion about your project and experience</li>
                            <li>Questions about the role and your fit with {company_name}</li>
                        </ul>
                    </div>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>We're excited to speak with you soon!</p>
                    <p style="color: #666;">Best regards,<br><strong>{company_name}</strong> Recruitment Team</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please don't reply to this message.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Interview scheduling email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Interview scheduling email failed: {str(e)}")
        return False


def send_interview_link_email(candidate_email, job_title, company_name, interview_link):
    """Send the final interview link to the candidate"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            return False
            
        subject = f"Your Interview Link - {job_title} at {company_name}"
        body = f"""
        <html>
            <body>
                <h2>Your interview for {job_title} is ready!</h2>
                <p>Hello,</p>
                <p>Your scheduled interview for {company_name} is coming up. Please use the secure link below to join.</p>
                
                <h3 style="color: #2563eb; margin: 20px 0;">Rules & Instructions:</h3>
                <ul>
                    <li>The room will only open exactly at your scheduled time.</li>
                    <li><strong style="color: red;">You have a maximum of 15 minutes to join after the scheduled start time.</strong></li>
                    <li>If you try to enter more than 15 minutes late, your interview will be automatically cancelled.</li>
                </ul>
                
                <a href="{interview_link}" style="display:inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                    Join Interview Room
                </a>
            </body>
        </html>
        """
        
        msg = MIMEMultipart()
        msg['From'] = f"Recruitment Team <{sender_email}>"
        msg['To'] = candidate_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending interview link: {str(e)}")
        return False


def send_offer_email(candidate_email, job_title, company_name):
    """Send offer/selection email to candidate"""
    try:
        sender_email = os.getenv("SENDER_EMAIL", "your-email@gmail.com")
        sender_password = os.getenv("EMAIL_PASSWORD", "")
        
        if not sender_password:
            print("EMAIL_PASSWORD not configured")
            return False
        
        subject = f"🎉 Job Offer - {job_title} at {company_name}"
        
        body = f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #4CAF50;">🎉 Congratulations!</h2>
                    
                    <p>Dear Candidate,</p>
                    
                    <p>We are delighted to extend a formal offer of employment for the position of <strong>{job_title}</strong> at <strong>{company_name}</strong>.</p>
                    
                    <p>After a thorough review of your qualifications, experience, and interview performance, we believe you are an excellent fit for our team. We are impressed with your skills and enthusiasm.</p>
                    
                    <div style="background-color: #f0f8ff; padding: 20px; border-left: 4px solid #2196F3; margin: 20px 0; border-radius: 5px;">
                        <h3 style="margin-top: 0; color: #2196F3;">Next Steps:</h3>
                        <ol style="margin: 10px 0; padding-left: 20px;">
                            <li>Review the attached offer letter carefully</li>
                            <li>Contact our HR team to discuss any questions</li>
                            <li>Sign and return the offer acceptance form within 7 days</li>
                        </ol>
                    </div>
                    
                    <p><strong>Position Details:</strong></p>
                    <ul style="color: #555;">
                        <li><strong>Job Title:</strong> {job_title}</li>
                        <li><strong>Company:</strong> {company_name}</li>
                        <li><strong>Employment Type:</strong> Full-time</li>
                    </ul>
                    
                    <p>Our HR team will reach out to you shortly with further details regarding compensation, benefits, and onboarding information.</p>
                    
                    <p>If you have any questions, please don't hesitate to contact us.</p>
                    
                    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                    
                    <p>We look forward to welcoming you to our team!</p>
                    <p style="color: #666;">Best regards,<br><strong>{company_name}</strong> - Hiring Team</p>
                    <p style="color: #999; font-size: 12px;">
                        <strong>Note:</strong> This is an automated email. Please contact HR for any modifications to the offer.
                    </p>
                </div>
            </body>
        </html>
        """
        
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = sender_email
        message["To"] = candidate_email
        message.attach(MIMEText(body, "html"))
        
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, candidate_email, message.as_string())
        
        print(f"✓ Offer email sent to {candidate_email}")
        return True
        
    except Exception as e:
        print(f"❌ Offer email failed: {str(e)}")
        return False


async def send_all_pending_notifications():
    """Check DB and send all pending shortlist/rejection emails"""
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:3000")
    
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("❌ Missing Supabase credentials")
        return {"success": False, "error": "Missing credentials"}
    
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
                    "resume_shortlist_email_sent_at": now.isoformat()
                }
            ).eq("id", app["id"]).execute()
        
        result = {
            "success": True,
            "shortlist_emails": shortlist_count,
            "rejection_emails": rejection_count,
            "failed": failed_count
        }
        print(f"✓ Email job completed: {result}")
        return result
        
    except Exception as e:
        print(f"❌ Error in send_all_pending_notifications: {str(e)}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}