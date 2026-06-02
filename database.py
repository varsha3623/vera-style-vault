import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URL = os.getenv("MONGO_URI")
if not MONGO_URL:
	raise RuntimeError("MONGO_URI environment variable is not set. See .env.example")

client = MongoClient(MONGO_URL)

DB_NAME = os.getenv("MONGO_DB", "vera_db")
db = client[DB_NAME]

wardrobe_collection = db["wardrobe"]
chat_collection = db["chat_history"]

print("MongoDB connected successfully to database:", DB_NAME)