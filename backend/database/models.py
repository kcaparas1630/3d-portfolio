"""Data models for raw and engineered feature data."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class WeatherCategory(str, Enum):
    """Weather category classification for one-hot encoding."""

    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    SNOWY = "snowy"
    STORMY = "stormy"
    FOGGY = "foggy"
    WINDY = "windy"


class RawDataRecord(BaseModel):
    """Model for raw data records from Supabase.

    This represents the structure of data stored in the raw_data table
    that will be queried for feature engineering.
    """

    id: int = Field(..., description="Unique identifier for the record")
    timestamp: datetime = Field(..., description="Timestamp of the data record")
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Humidity percentage (0-100)")
    pressure: float = Field(..., description="Atmospheric pressure in hPa")
    wind_speed: float = Field(..., ge=0, description="Wind speed in m/s")
    precipitation: float = Field(..., ge=0, description="Precipitation in mm")
    weather_category: WeatherCategory = Field(..., description="Weather category classification")
    location: str | None = Field(None, description="Location identifier")

    model_config = ConfigDict(from_attributes=True)


class TrainingDataRecord(BaseModel):
    """Model for training-ready data with engineered features.

    This represents the structure of data that will be stored in the
    training_data table after feature engineering.
    """

    id: int = Field(..., description="Unique identifier for the record")
    raw_data_id: int = Field(..., description="Reference to the original raw_data record")
    timestamp: datetime = Field(..., description="Original timestamp")

    # Original features
    temperature: float = Field(..., description="Temperature in Celsius")
    humidity: float = Field(..., description="Humidity percentage")
    pressure: float = Field(..., description="Atmospheric pressure in hPa")
    wind_speed: float = Field(..., description="Wind speed in m/s")
    precipitation: float = Field(..., description="Precipitation in mm")

    # Temporal features
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour of the day (0-23)")
    day_of_week: int = Field(..., ge=0, le=6, description="Day of the week (0=Monday, 6=Sunday)")
    month: int = Field(..., ge=1, le=12, description="Month of the year (1-12)")
    is_weekend: bool = Field(..., description="Whether the day is a weekend")

    # Moving averages (7-day)
    temperature_7d_avg: float | None = Field(
        None, description="7-day moving average of temperature"
    )
    humidity_7d_avg: float | None = Field(None, description="7-day moving average of humidity")
    pressure_7d_avg: float | None = Field(None, description="7-day moving average of pressure")
    wind_speed_7d_avg: float | None = Field(None, description="7-day moving average of wind speed")
    precipitation_7d_avg: float | None = Field(
        None, description="7-day moving average of precipitation"
    )

    # One-hot encoded weather categories
    weather_clear: bool = Field(default=False, description="Weather category: clear")
    weather_cloudy: bool = Field(default=False, description="Weather category: cloudy")
    weather_rainy: bool = Field(default=False, description="Weather category: rainy")
    weather_snowy: bool = Field(default=False, description="Weather category: snowy")
    weather_stormy: bool = Field(default=False, description="Weather category: stormy")
    weather_foggy: bool = Field(default=False, description="Weather category: foggy")
    weather_windy: bool = Field(default=False, description="Weather category: windy")

    # Additional derived features
    feels_like_temperature: float | None = Field(
        None, description="Calculated feels-like temperature"
    )
    dew_point: float | None = Field(None, description="Calculated dew point temperature")

    model_config = ConfigDict(from_attributes=True)


class PipelineConfig(BaseModel):
    """Configuration for the feature engineering pipeline."""

    raw_data_table: str = Field(default="raw_data", description="Name of the raw data table")
    training_data_table: str = Field(
        default="training_data", description="Name of the training data table"
    )
    moving_average_window: int = Field(
        default=7, ge=1, description="Window size for moving averages in days"
    )
    batch_size: int = Field(default=1000, ge=1, description="Batch size for data processing")
