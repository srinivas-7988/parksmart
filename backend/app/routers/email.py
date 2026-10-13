from fastapi import APIRouter
from app.services.email_service import send_email

router = APIRouter()


@router.get("/test")
async def test_email():

    success = await send_email(
        "donseena129@gmail.com",
        "ParkSmart Test Email",
        "Congratulations!\n\nYour ParkSmart email service is working successfully."
    )

    if success:
        return {
            "message": "Email Sent Successfully"
        }

    return {
        "message": "Email Failed"
    }