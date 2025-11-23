"""Configuration management for the feature engineering pipeline."""

import logging
from pathlib import Path

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load environment variables from .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    All settings can be overridden via environment variables or a .env file.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Supabase configuration
    supabase_url: str = Field(
        ...,
        description="Supabase project URL",
    )
    supabase_key: str = Field(
        ...,
        description="Supabase service role key or anon key",
    )

    # Table names
    raw_data_table: str = Field(
        default="raw_data",
        description="Name of the raw data source table",
    )
    training_data_table: str = Field(
        default="training_data",
        description="Name of the training data destination table",
    )

    # Pipeline configuration
    moving_average_window: int = Field(
        default=7,
        ge=1,
        description="Window size in days for calculating moving averages",
    )
    batch_size: int = Field(
        default=1000,
        ge=1,
        description="Batch size for database operations",
    )

    # Logging configuration
    log_level: str = Field(
        default="INFO",
        description="Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)",
    )

    def get_log_level(self) -> int:
        """Convert string log level to logging constant."""
        return getattr(logging, self.log_level.upper(), logging.INFO)


_settings: Settings | None = None


def get_settings() -> Settings:
    """Get or create the application settings singleton.

    Returns:
        Settings instance

    Raises:
        ValueError: If required environment variables are not set
    """
    global _settings

    if _settings is None:
        try:
            _settings = Settings()  # type: ignore[call-arg]
            logger.info("Settings loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load settings: {e}")
            raise

    return _settings


def configure_logging(level: int | None = None) -> None:
    """Configure logging for the application.

    Args:
        level: Logging level to use (defaults to settings value)
    """
    settings = get_settings()
    log_level = level or settings.get_log_level()

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Set level for all loggers in our modules
    for module in ["feature_engineering", "database", "__main__"]:
        module_logger = logging.getLogger(module)
        module_logger.setLevel(log_level)

    logger.info(f"Logging configured at level: {logging.getLevelName(log_level)}")
