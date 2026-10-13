import bcrypt


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    if len(password_bytes) > 72:
        raise ValueError("Password must be at most 72 bytes when encoded as UTF-8.")

    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)

    return hashed.decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    password_bytes = password.encode("utf-8")

    # bcrypt supports a maximum of 72 password bytes.
    if len(password_bytes) > 72:
        return False

    try:
        return bcrypt.checkpw(
            password_bytes,
            hashed.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False
