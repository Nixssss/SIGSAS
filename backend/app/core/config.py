from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg2://postgres:1234@localhost:5432/sigsas"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()