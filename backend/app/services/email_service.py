import mimetypes
import os
from email.message import EmailMessage

import aiosmtplib
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment: str | None = None,
):
    """Send an email. Email failure is logged but does not break the API flow."""
    if not EMAIL_ADDRESS or not EMAIL_PASSWORD:
        print("Email not configured. Skipping email to:", to_email)
        return False

    message = EmailMessage()
    message["From"] = EMAIL_ADDRESS
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    html_body = body.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    html_body = html_body.replace("\n", "<br>")
    message.add_alternative(
        f"""
        <html><body style="font-family:Arial;background:#f4f7f6;padding:24px;">
          <div style="background:#fff;padding:24px;border-radius:12px;max-width:600px;margin:auto;">
            <h2 style="color:#00a67d;">🚗 ParkSmart</h2>
            <hr>
            <p>{html_body}</p>
            <hr>
            <small>This is an automated email from ParkSmart.</small>
          </div>
        </body></html>
        """,
        subtype="html",
    )

    if attachment and os.path.exists(attachment):
        mime_type, _ = mimetypes.guess_type(attachment)
        if mime_type:
            maintype, subtype = mime_type.split("/", 1)
            with open(attachment, "rb") as file:
                message.add_attachment(
                    file.read(),
                    maintype=maintype,
                    subtype=subtype,
                    filename=os.path.basename(attachment),
                )

    try:
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=EMAIL_ADDRESS,
            password=EMAIL_PASSWORD,
        )
        return True
    except Exception as exc:
        print("Email sending failed:", exc)
        return False
