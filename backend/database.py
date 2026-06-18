import os
import datetime
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "aquatrace")
COLLECTION_NAME = "single_tank_logs" 

client = None
db = None
collection = None

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    # Test connection
    client.admin.command('ping')
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]
    
    # Create index on timestamp for efficient querying
    collection.create_index("timestamp")
    print("✓ MongoDB connected successfully")
except Exception as e:
    print(f"⚠️  MongoDB connection failed: {e}")
    print("⚠️  Running in memory-only mode (data will not persist)")
    client = None
    db = None
    collection = None

def save_sensor_data(data):
    """Save sensor data to MongoDB"""
    if collection is None:
        print("⚠️  Skipping database save (MongoDB not available)")
        return None
    try:
        # Generate the timestamp right before saving
        data["timestamp"] = datetime.datetime.utcnow()
        result = collection.insert_one(data)
        return result.inserted_id
    except Exception as e:
        print(f"⚠️  Failed to save to database: {e}")
        return None

def get_latest_reading():
    """Get the most recent sensor reading"""
    if collection is None:
        return None
    try:
        # {"_id": 0} hides the unreadable MongoDB ID from React
        return collection.find_one({}, {"_id": 0}, sort=[("timestamp", -1)])
    except Exception as e:
        print(f"⚠️  Failed to get latest reading: {e}")
        return None

def get_readings_by_time_range(start_time, end_time):
    """Get sensor readings within a time range"""
    if collection is None:
        return []
    try:
        # Convert incoming epoch milliseconds (from React) into datetime objects
        if isinstance(start_time, int):
            start_dt = datetime.datetime.utcfromtimestamp(start_time / 1000.0)
        else:
            start_dt = start_time
            
        if isinstance(end_time, int):
            end_dt = datetime.datetime.utcfromtimestamp(end_time / 1000.0)
        else:
            end_dt = end_time

        # Hide the MongoDB ID and search using the new datetime objects
        return list(collection.find({
            "timestamp": {"$gte": start_dt, "$lte": end_dt}
        }, {"_id": 0}).sort("timestamp", -1))
    except Exception as e:
        print(f"⚠️  Failed to get readings: {e}")
        return []

def get_all_readings(limit=100):
    """Get all sensor readings with limit"""
    if collection is None:
        return []
    try:
        # Hide the MongoDB ID
        return list(collection.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))
    except Exception as e:
        print(f"⚠️  Failed to get readings: {e}")
        return []