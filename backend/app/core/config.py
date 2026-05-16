from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SIGSAS - TCC"
    USE_SQLITE_LOCAL: bool = True 
    OPENAI_API_KEY: str = "" 

    @property
    def DATABASE_URI(self) -> str:
        if self.USE_SQLITE_LOCAL:
            return "sqlite:///./banco_temporario.db"
        return "postgresql://usuario:senha@localhost/banco"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()