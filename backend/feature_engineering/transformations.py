"""Feature engineering transformations for raw data."""

import logging

import numpy as np
import pandas as pd

from database.models import WeatherCategory

logger = logging.getLogger(__name__)


class FeatureEngineer:
    """Transforms raw data into engineered features for ML training.

    Implements various feature engineering techniques including:
    - Temporal features (hour_of_day, day_of_week, etc.)
    - Moving averages
    - One-hot encoding for categorical variables
    - Derived features (feels-like temperature, dew point)
    """

    def __init__(self, moving_average_window: int = 7) -> None:
        """Initialize the feature engineer.

        Args:
            moving_average_window: Window size in days for moving averages
        """
        self._moving_average_window = moving_average_window
        logger.info(f"FeatureEngineer initialized with {moving_average_window}-day moving average")

    @property
    def moving_average_window(self) -> int:
        """Get the moving average window size."""
        return self._moving_average_window

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply all feature engineering transformations to raw data.

        Args:
            df: DataFrame with raw data (must contain 'timestamp' column)

        Returns:
            DataFrame with all engineered features
        """
        if df.empty:
            logger.warning("Cannot transform empty DataFrame")
            return df

        logger.info(f"Starting feature engineering on {len(df)} records")

        # Create a copy to avoid modifying the original
        result = df.copy()

        # Ensure timestamp is datetime
        if "timestamp" in result.columns:
            result["timestamp"] = pd.to_datetime(result["timestamp"])

        # Add raw_data_id reference if 'id' column exists
        if "id" in result.columns:
            result["raw_data_id"] = result["id"]

        # Apply transformations in order
        result = self._add_temporal_features(result)
        result = self._add_moving_averages(result)
        result = self._add_one_hot_encoding(result)
        result = self._add_derived_features(result)

        logger.info(f"Feature engineering complete. Output has {len(result.columns)} columns")
        return result

    def _add_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add temporal features extracted from timestamp.

        Adds:
        - hour_of_day (0-23)
        - day_of_week (0=Monday, 6=Sunday)
        - month (1-12)
        - is_weekend (boolean)

        Args:
            df: DataFrame with 'timestamp' column

        Returns:
            DataFrame with temporal features added
        """
        if "timestamp" not in df.columns:
            logger.warning("No 'timestamp' column found - skipping temporal features")
            return df

        logger.debug("Adding temporal features")

        df["hour_of_day"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["month"] = df["timestamp"].dt.month
        df["is_weekend"] = df["day_of_week"].isin([5, 6])

        return df

    def _add_moving_averages(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate rolling moving averages for numeric features.

        Computes 7-day (or configured window) moving averages for:
        - temperature
        - humidity
        - pressure
        - wind_speed
        - precipitation

        Args:
            df: DataFrame with numeric columns

        Returns:
            DataFrame with moving average columns added
        """
        logger.debug(f"Adding {self._moving_average_window}-day moving averages")

        # Define columns to calculate moving averages for
        numeric_cols = ["temperature", "humidity", "pressure", "wind_speed", "precipitation"]

        # Sort by timestamp if present
        if "timestamp" in df.columns:
            df = df.sort_values("timestamp").reset_index(drop=True)

        for col in numeric_cols:
            if col in df.columns:
                avg_col_name = f"{col}_{self._moving_average_window}d_avg"

                # Calculate rolling mean with minimum periods to handle edge cases
                df[avg_col_name] = (
                    df[col].rolling(window=self._moving_average_window, min_periods=1).mean()
                )

                logger.debug(f"Created {avg_col_name}")
            else:
                logger.warning(f"Column '{col}' not found - skipping moving average")

        return df

    def _add_one_hot_encoding(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply one-hot encoding to weather category.

        Creates boolean columns for each weather category:
        - weather_clear
        - weather_cloudy
        - weather_rainy
        - weather_snowy
        - weather_stormy
        - weather_foggy
        - weather_windy

        Args:
            df: DataFrame with 'weather_category' column

        Returns:
            DataFrame with one-hot encoded weather columns
        """
        if "weather_category" not in df.columns:
            logger.warning("No 'weather_category' column found - skipping one-hot encoding")
            return df

        logger.debug("Adding one-hot encoded weather categories")

        # Initialize all weather columns to False
        for category in WeatherCategory:
            col_name = f"weather_{category.value}"
            df[col_name] = False

        # Set the appropriate column to True for each row
        for category in WeatherCategory:
            col_name = f"weather_{category.value}"
            mask = df["weather_category"] == category.value
            df.loc[mask, col_name] = True

        return df

    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived features calculated from base features.

        Adds:
        - feels_like_temperature: Wind chill or heat index adjusted temperature
        - dew_point: Calculated dew point temperature

        Args:
            df: DataFrame with temperature, humidity, and wind_speed columns

        Returns:
            DataFrame with derived features added
        """
        logger.debug("Adding derived features")

        # Calculate feels-like temperature
        if "temperature" in df.columns and "wind_speed" in df.columns:
            df["feels_like_temperature"] = self._calculate_feels_like(
                df["temperature"], df["wind_speed"], df.get("humidity")
            )

        # Calculate dew point
        if "temperature" in df.columns and "humidity" in df.columns:
            df["dew_point"] = self._calculate_dew_point(df["temperature"], df["humidity"])

        return df

    def _calculate_feels_like(
        self,
        temperature: pd.Series,
        wind_speed: pd.Series,
        humidity: pd.Series | None = None,
    ) -> pd.Series:
        """Calculate feels-like temperature using wind chill and heat index.

        Uses wind chill formula for cold temperatures (< 10C) and
        heat index for warm temperatures (> 27C).

        Args:
            temperature: Temperature in Celsius
            wind_speed: Wind speed in m/s
            humidity: Relative humidity (0-100), optional

        Returns:
            Series of feels-like temperatures
        """
        # Convert wind speed from m/s to km/h for wind chill calculation
        wind_speed_kmh = wind_speed * 3.6

        # Initialize with actual temperature
        feels_like = temperature.copy()

        # Wind chill for cold temperatures (< 10C) - uses Environment Canada formula
        cold_mask = temperature < 10
        if cold_mask.any():
            feels_like.loc[cold_mask] = (
                13.12
                + 0.6215 * temperature.loc[cold_mask]
                - 11.37 * (wind_speed_kmh.loc[cold_mask] ** 0.16)
                + 0.3965 * temperature.loc[cold_mask] * (wind_speed_kmh.loc[cold_mask] ** 0.16)
            )

        # Heat index for warm temperatures (> 27C) with humidity
        if humidity is not None:
            hot_mask = temperature > 27
            if hot_mask.any():
                # Simplified heat index formula
                t = temperature.loc[hot_mask]
                h = humidity.loc[hot_mask]
                feels_like.loc[hot_mask] = (
                    -8.78469475556
                    + 1.61139411 * t
                    + 2.33854883889 * h
                    - 0.14611605 * t * h
                    - 0.012308094 * (t**2)
                    - 0.0164248277778 * (h**2)
                    + 0.002211732 * (t**2) * h
                    + 0.00072546 * t * (h**2)
                    - 0.000003582 * (t**2) * (h**2)
                )

        return feels_like

    def _calculate_dew_point(self, temperature: pd.Series, humidity: pd.Series) -> pd.Series:
        """Calculate dew point temperature using Magnus-Tetens formula.

        Args:
            temperature: Temperature in Celsius
            humidity: Relative humidity (0-100)

        Returns:
            Series of dew point temperatures in Celsius
        """
        # Magnus-Tetens coefficients
        a = 17.27
        b = 237.7

        # Calculate intermediate value
        alpha = (a * temperature) / (b + temperature) + np.log(humidity / 100.0)

        # Calculate dew point
        dew_point = (b * alpha) / (a - alpha)

        return dew_point  # type: ignore[no-any-return]

    def select_training_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Select only the columns needed for training data.

        Removes intermediate or unnecessary columns.

        Args:
            df: DataFrame with all engineered features

        Returns:
            DataFrame with only training-relevant columns
        """
        # Define the columns to keep in the training data
        training_columns = [
            # Identifiers
            "raw_data_id",
            "timestamp",
            # Original features
            "temperature",
            "humidity",
            "pressure",
            "wind_speed",
            "precipitation",
            # Temporal features
            "hour_of_day",
            "day_of_week",
            "month",
            "is_weekend",
            # Moving averages
            f"temperature_{self._moving_average_window}d_avg",
            f"humidity_{self._moving_average_window}d_avg",
            f"pressure_{self._moving_average_window}d_avg",
            f"wind_speed_{self._moving_average_window}d_avg",
            f"precipitation_{self._moving_average_window}d_avg",
            # One-hot encoded weather
            "weather_clear",
            "weather_cloudy",
            "weather_rainy",
            "weather_snowy",
            "weather_stormy",
            "weather_foggy",
            "weather_windy",
            # Derived features
            "feels_like_temperature",
            "dew_point",
        ]

        # Select only columns that exist in the DataFrame
        available_columns = [col for col in training_columns if col in df.columns]
        missing_columns = set(training_columns) - set(available_columns)

        if missing_columns:
            logger.warning(f"Missing columns in training data: {missing_columns}")

        return df[available_columns]
