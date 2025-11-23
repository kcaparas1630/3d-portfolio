# AI Feature Engineering Pipeline

A dedicated Python module for the AI feature engineering pipeline that queries raw data from Supabase, engineers necessary features, and stores training-ready data.

## Features

The pipeline performs the following feature engineering transformations:

### Temporal Features
- `hour_of_day`: Hour extracted from timestamp (0-23)
- `day_of_week`: Day of week (0=Monday, 6=Sunday)
- `month`: Month of year (1-12)
- `is_weekend`: Boolean flag for weekend days

### Moving Averages (7-day default)
- `temperature_7d_avg`: 7-day rolling average of temperature
- `humidity_7d_avg`: 7-day rolling average of humidity
- `pressure_7d_avg`: 7-day rolling average of pressure
- `wind_speed_7d_avg`: 7-day rolling average of wind speed
- `precipitation_7d_avg`: 7-day rolling average of precipitation

### One-Hot Encoded Weather Categories
- `weather_clear`
- `weather_cloudy`
- `weather_rainy`
- `weather_snowy`
- `weather_stormy`
- `weather_foggy`
- `weather_windy`

### Derived Features
- `feels_like_temperature`: Wind chill / heat index adjusted temperature
- `dew_point`: Calculated dew point temperature

## Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Unix/MacOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# For development dependencies
pip install -e ".[dev]"
```

## Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase service role key

Optional environment variables:
- `RAW_DATA_TABLE`: Name of raw data table (default: `raw_data`)
- `TRAINING_DATA_TABLE`: Name of training data table (default: `training_data`)
- `MOVING_AVERAGE_WINDOW`: Days for moving average (default: `7`)
- `BATCH_SIZE`: Batch size for DB operations (default: `1000`)
- `LOG_LEVEL`: Logging level (default: `INFO`)

## Database Schema

### Raw Data Table (`raw_data`)

| Column | Type | Description |
|--------|------|-------------|
| id | integer | Primary key |
| timestamp | timestamp | Data timestamp |
| temperature | float | Temperature in Celsius |
| humidity | float | Humidity percentage (0-100) |
| pressure | float | Atmospheric pressure in hPa |
| wind_speed | float | Wind speed in m/s |
| precipitation | float | Precipitation in mm |
| weather_category | string | Category: clear, cloudy, rainy, snowy, stormy, foggy, windy |
| location | string | Optional location identifier |

### Training Data Table (`training_data`)

The training data table contains all original columns plus engineered features.

## Usage

### Command Line Interface

```bash
# Run incremental processing (only new data since last run)
python main.py --incremental

# Process data for a specific date range
python main.py --start-date 2024-01-01 --end-date 2024-06-30

# Full refresh (clear and reprocess all data)
python main.py --full-refresh

# Process data for a specific location
python main.py --location "new-york" --incremental

# Enable debug logging
python main.py --log-level DEBUG
```

### Programmatic Usage

```python
from config import get_settings
from database.client import SupabaseClient
from database.models import PipelineConfig
from feature_engineering.pipeline import FeatureEngineeringPipeline

# Load settings
settings = get_settings()

# Create pipeline configuration
config = PipelineConfig(
    raw_data_table=settings.raw_data_table,
    training_data_table=settings.training_data_table,
    moving_average_window=7,
)

# Initialize Supabase client
client = SupabaseClient(
    url=settings.supabase_url,
    key=settings.supabase_key,
    config=config,
)

# Create and run pipeline
pipeline = FeatureEngineeringPipeline(supabase_client=client, config=config)
stats = pipeline.run(incremental=True)

print(f"Processed {stats['raw_records']} raw records")
print(f"Stored {stats['stored_records']} training records")
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=feature_engineering --cov=database

# Run specific test file
pytest tests/test_transformations.py

# Run with verbose output
pytest -v
```

## Project Structure

```
backend/
├── config.py                 # Configuration management
├── main.py                   # CLI entry point
├── pyproject.toml           # Python package configuration
├── requirements.txt         # Dependencies
├── .env.example             # Environment variables template
├── README.md                # This file
│
├── database/                # Database operations
│   ├── __init__.py
│   ├── client.py            # Supabase client
│   └── models.py            # Pydantic data models
│
├── feature_engineering/     # Feature engineering logic
│   ├── __init__.py
│   ├── pipeline.py          # Pipeline orchestration
│   └── transformations.py   # Feature transformations
│
└── tests/                   # Unit tests
    ├── __init__.py
    ├── conftest.py          # Pytest fixtures
    ├── test_models.py
    ├── test_pipeline.py
    └── test_transformations.py
```

## License

MIT
