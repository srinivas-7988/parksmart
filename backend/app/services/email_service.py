import os
import mimetypes
import aiosmtplib

from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    attachment: str = None
):

    message = EmailMessage()

    message["From"] = EMAIL_ADDRESS
    message["To"] = to_email
    message["Subject"] = subject

    message.set_content(body)

    message.add_alternative(
        f"""
        <html>
        <body style="font-family:Arial;background:#f4f4f4;padding:20px;">
            <div style="
                background:white;
                padding:25px;
                border-radius:10px;
                max-width:600px;
                margin:auto;
            ">

            <h2 style="color:#1976d2;">
            🚗 ParkSmart
            </h2>

            <hr>

            <p>{body.replace(chr(10), "<br>")}</p>

            <hr>

            <small>
            This is an automated email from ParkSmart.
            </small>

            </div>
        </body>
        </html>
        """,
        subtype="html"
    )

    if attachment and os.path.exists(attachment):

        mime_type, _ = mimetypes.guess_type(attachment)

        if mime_type:
            maintype, subtype = mime_type.split("/")

            with open(attachment, "rb") as file:
                message.add_attachment(
                    file.read(),
                    maintype=maintype,
                    subtype=subtype,
                    filename=os.path.basename(attachment)
                )

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=EMAIL_ADDRESS,
        password=EMAIL_PASSWORD
    )