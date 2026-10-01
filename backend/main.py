from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Literal, Optional

import sqlite3
import hashlib
import secrets
import os


# ====================================================
# FASTAPI APP
# ====================================================

app = FastAPI(
    title="Ride Booking API",
    description="Backend API for our Ride Booking System",
    version="2.0.0"
)
security = HTTPBearer()


# ====================================================
# CORS
# ====================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ====================================================
# DATABASE
# ====================================================

DATABASE_NAME = "ridebooking.db"


def get_db_connection():

    connection = sqlite3.connect(
        DATABASE_NAME
    )

    connection.row_factory = sqlite3.Row

    return connection


# ====================================================
# PASSWORD FUNCTIONS
# ====================================================

def hash_password(password: str):

    salt = os.urandom(16)

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )

    return (
        salt.hex(),
        password_hash.hex()
    )


def verify_password(
    password: str,
    salt_hex: str,
    stored_hash_hex: str
):

    salt = bytes.fromhex(
        salt_hex
    )

    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        100000
    )

    return secrets.compare_digest(
        password_hash.hex(),
        stored_hash_hex
    )


# ====================================================
# CREATE / MIGRATE DATABASE
# ====================================================

def create_tables():

    connection = get_db_connection()

    cursor = connection.cursor()


    # ------------------------------------------------
    # USERS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (

            user_id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT NOT NULL UNIQUE,

            phone TEXT,

            password_hash TEXT NOT NULL,

            password_salt TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

        # ------------------------------------------------
    # DRIVERS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS drivers (

            driver_id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            phone TEXT NOT NULL UNIQUE,

            email TEXT UNIQUE,

            password_hash TEXT NOT NULL,

            password_salt TEXT NOT NULL,

            vehicle_type TEXT NOT NULL,

            vehicle_number TEXT NOT NULL UNIQUE,

            is_available INTEGER NOT NULL DEFAULT 1,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
        # ------------------------------------------------
    # DRIVER SESSIONS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS driver_sessions (

            session_id INTEGER PRIMARY KEY AUTOINCREMENT,

            driver_id INTEGER NOT NULL,

            token TEXT NOT NULL UNIQUE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (driver_id)
                REFERENCES drivers(driver_id)
        )
        """
    )

        # ------------------------------------------------
    # ADMINS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admins (

            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            email TEXT NOT NULL UNIQUE,

            password_hash TEXT NOT NULL,

            password_salt TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
        # ------------------------------------------------
    # ADMIN SESSIONS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS admin_sessions (

            session_id INTEGER PRIMARY KEY AUTOINCREMENT,

            admin_id INTEGER NOT NULL,

            token TEXT NOT NULL UNIQUE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (admin_id)
                REFERENCES admins(admin_id)
        )
        """
    )


    # ------------------------------------------------
    # SESSIONS TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions (

            session_id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER NOT NULL,

            token TEXT NOT NULL UNIQUE,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(user_id)
        )
        """
    )


    # ------------------------------------------------
    # RIDES TABLE
    # ------------------------------------------------

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS rides (

            ride_id INTEGER PRIMARY KEY AUTOINCREMENT,

            user_id INTEGER,

            pickup TEXT NOT NULL,
            pickup_lat REAL NOT NULL,
            pickup_lon REAL NOT NULL,

            destination TEXT NOT NULL,
            destination_lat REAL NOT NULL,
            destination_lon REAL NOT NULL,

            distance REAL NOT NULL,
            duration INTEGER NOT NULL,

            ride_type TEXT NOT NULL,
            fare REAL NOT NULL,

            status TEXT NOT NULL
                DEFAULT 'searching_driver',

            created_at TIMESTAMP
                DEFAULT CURRENT_TIMESTAMP,

            FOREIGN KEY (user_id)
                REFERENCES users(user_id)
        )
        """
    )



    # ------------------------------------------------
    # MIGRATION
    #
    # Your existing database already has rides table,
    # but it does not yet have user_id.
    #
    # This safely adds user_id if needed.
    # ------------------------------------------------

    cursor.execute(
        """
        PRAGMA table_info(rides)
        """
    )

    columns = cursor.fetchall()

    column_names = [
        column["name"]
        for column in columns
    ]


    if "user_id" not in column_names:

        cursor.execute(
            """
            ALTER TABLE rides
            ADD COLUMN user_id INTEGER
            """
        )
    if "driver_id" not in column_names:

        cursor.execute(
            """
            ALTER TABLE rides
            ADD COLUMN driver_id INTEGER
            """
        )

        # ------------------------------------------------
    # CREATE DEFAULT ADMIN
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT admin_id
        FROM admins
        LIMIT 1
        """
    )

    existing_admin = cursor.fetchone()

    if existing_admin is None:

        salt_hex, password_hash_hex = hash_password(
            "admin123"
        )

        cursor.execute(
            """
            INSERT INTO admins (
                name,
                email,
                password_hash,
                password_salt
            )
            VALUES (?, ?, ?, ?)
            """,
            (
                "System Admin",
                "admin@ridebooking.com",
                password_hash_hex,
                salt_hex
            )
        )

    connection.commit()

    connection.close()


create_tables()

    

# ====================================================
# PYDANTIC MODELS
# ====================================================


# ----------------------------------------------------
# SIGNUP
# ----------------------------------------------------

class SignupRequest(BaseModel):

    name: str

    email: str

    phone: Optional[str] = None

    password: str

# ----------------------------------------------------
# DRIVER SIGNUP REQUEST
# ----------------------------------------------------

class DriverSignupRequest(BaseModel):

    name: str

    email: str

    phone: str

    password: str

    vehicle_type: str

    vehicle_number: str


# ----------------------------------------------------
# LOGIN
# ----------------------------------------------------

class LoginRequest(BaseModel):

    email: str

    password: str

# ----------------------------------------------------
# ADMIN LOGIN REQUEST
# ----------------------------------------------------

class AdminLoginRequest(BaseModel):

    email: str

    password: str

# ----------------------------------------------------
# RIDE REQUEST
# ----------------------------------------------------

class RideRequest(BaseModel):

    pickup: str
    pickup_lat: float
    pickup_lon: float

    destination: str
    destination_lat: float
    destination_lon: float

    distance: float
    duration: int

    ride_type: Literal[
        "Bike",
        "Auto",
        "Cab"
    ]

    fare: float


# ====================================================
# AUTHENTICATION HELPERS
# ====================================================

def get_token_from_header(
    authorization: Optional[str]
):

    if not authorization:

        raise HTTPException(
            status_code=401,
            detail="Login required"
        )


    if not authorization.startswith(
        "Bearer "
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header"
        )


    token = authorization.replace(
        "Bearer ",
        "",
        1
    ).strip()


    if not token:

        raise HTTPException(
            status_code=401,
            detail="Invalid session token"
        )


    return token


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            users.user_id,
            users.name,
            users.email,
            users.phone,
            users.created_at
        FROM sessions
        JOIN users
        ON sessions.user_id = users.user_id
        WHERE sessions.token = ?
        """,
        (token,)
    )

    user = cursor.fetchone()

    connection.close()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Session expired or invalid"
        )

    return dict(user)
    # ----------------------------------------------------
# GET CURRENT DRIVER
# ----------------------------------------------------

def get_current_driver(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            drivers.driver_id,
            drivers.name,
            drivers.phone,
            drivers.email,
            drivers.vehicle_type,
            drivers.vehicle_number,
            drivers.is_available,
            drivers.created_at

        FROM driver_sessions

        JOIN drivers
        ON driver_sessions.driver_id = drivers.driver_id

        WHERE driver_sessions.token = ?
        """,
        (token,)
    )

    driver = cursor.fetchone()

    connection.close()


    if driver is None:

        raise HTTPException(
            status_code=401,
            detail="Driver session expired or invalid"
        )


    return dict(driver)

# ----------------------------------------------------
# GET CURRENT ADMIN
# ----------------------------------------------------

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            admins.admin_id,
            admins.name,
            admins.email,
            admins.created_at

        FROM admin_sessions

        JOIN admins
        ON admin_sessions.admin_id = admins.admin_id

        WHERE admin_sessions.token = ?
        """,
        (
            token,
        )
    )

    admin = cursor.fetchone()

    connection.close()

    if admin is None:

        raise HTTPException(
            status_code=401,
            detail="Admin session expired or invalid"
        )

    return dict(admin)

# ----------------------------------------------------
# ADMIN ME
# ----------------------------------------------------

@app.get("/api/admin/me")
def admin_me(
    admin: dict = Depends(get_current_admin)
):

    return {
        "success": True,
        "admin": admin
    }

# ----------------------------------------------------
# ADMIN DASHBOARD
# ----------------------------------------------------

@app.get("/api/admin/dashboard")
def admin_dashboard(
    admin: dict = Depends(get_current_admin)
):

    connection = get_db_connection()
    cursor = connection.cursor()

    # Total customers
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM users
        """
    )

    total_users = cursor.fetchone()[0]


    # Total drivers
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM drivers
        """
    )

    total_drivers = cursor.fetchone()[0]


    # Total rides
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM rides
        """
    )

    total_rides = cursor.fetchone()[0]


    # Completed rides
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM rides
        WHERE status = 'completed'
        """
    )

    completed_rides = cursor.fetchone()[0]


    # Active rides
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM rides
        WHERE status IN (
            'searching_driver',
            'driver_assigned',
            'ride_started'
        )
        """
    )

    active_rides = cursor.fetchone()[0]


    # Cancelled rides
    cursor.execute(
        """
        SELECT COUNT(*)
        FROM rides
        WHERE status = 'cancelled'
        """
    )

    cancelled_rides = cursor.fetchone()[0]


    connection.close()


    return {
        "success": True,
        "dashboard": {
            "total_users": total_users,
            "total_drivers": total_drivers,
            "total_rides": total_rides,
            "completed_rides": completed_rides,
            "active_rides": active_rides,
            "cancelled_rides": cancelled_rides
        }
    }

# ----------------------------------------------------
# ADMIN USERS
# ----------------------------------------------------

@app.get("/api/admin/users")
def admin_users(
    admin: dict = Depends(get_current_admin)
):

    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            user_id,
            name,
            email,
            phone,
            created_at
        FROM users
        ORDER BY user_id DESC
        """
    )

    users = cursor.fetchall()

    connection.close()

    return {
        "success": True,
        "total_users": len(users),
        "users": [
            dict(user)
            for user in users
        ]
    }

# ----------------------------------------------------
# DRIVER AVAILABLE RIDES
# ----------------------------------------------------

@app.get("/api/driver/available-rides")
def get_available_rides(
    driver: dict = Depends(get_current_driver)
):

    # ------------------------------------------------
    # CHECK DRIVER AVAILABILITY
    # ------------------------------------------------

    if driver["is_available"] == 0:

        return {
            "success": True,
            "rides": []
        }

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE status = 'searching_driver'
          AND ride_type = ?
          AND driver_id IS NULL
        ORDER BY created_at DESC
        """,
        (
            driver["vehicle_type"],
        )
    )

    rides = cursor.fetchall()

    connection.close()

    return {
        "success": True,
        "rides": [
            dict(ride)
            for ride in rides
        ]
    }
# ----------------------------------------------------
# DRIVER AVAILABILITY
# ----------------------------------------------------

@app.post("/api/driver/availability")
def update_driver_availability(
    is_available: bool,
    driver: dict = Depends(get_current_driver)
):

    connection = get_db_connection()
    cursor = connection.cursor()

    # Driver cannot go offline while handling a ride
    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE driver_id = ?
          AND status IN ('driver_assigned', 'ride_started')
        LIMIT 1
        """,
        (
            driver["driver_id"],
        )
    )

    active_ride = cursor.fetchone()

    if active_ride is not None and is_available is False:

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="You cannot go offline while you have an active ride."
        )

    cursor.execute(
        """
        UPDATE drivers
        SET is_available = ?
        WHERE driver_id = ?
        """,
        (
            1 if is_available else 0,
            driver["driver_id"],
        )
    )

    connection.commit()
    connection.close()

    return {
        "success": True,
        "is_available": is_available
    }

@app.get("/api/driver/current-ride")
def get_driver_current_ride(
    driver: dict = Depends(get_current_driver)
):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE driver_id = ?
          AND status IN ('driver_assigned', 'ride_started')
        ORDER BY ride_id DESC
        LIMIT 1
        """,
        (
            driver["driver_id"],
        )
    )

    row = cursor.fetchone()
    connection.close()

    if row is None:
        return {
            "success": True,
            "ride": None
        }

    return {
        "success": True,
        "ride": dict(row)
    }
# ----------------------------------------------------
# DRIVER ACCEPT RIDE
# ----------------------------------------------------

@app.post("/api/driver/rides/{ride_id}/accept")
def accept_ride(
    ride_id: int,
    driver: dict = Depends(get_current_driver)
):

    connection = get_db_connection()

    cursor = connection.cursor()


    # ------------------------------------------------
    # FIND AVAILABLE RIDE
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
          AND status = 'searching_driver'
          AND driver_id IS NULL
        """,
        (ride_id,)
    )

    ride = cursor.fetchone()


    if ride is None:

        connection.close()

        raise HTTPException(
            status_code=409,
            detail="Ride is no longer available"
        )


    # ------------------------------------------------
    # CHECK VEHICLE TYPE
    # ------------------------------------------------

    if ride["ride_type"] != driver["vehicle_type"]:

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="This ride does not match your vehicle type"
        )


    # ------------------------------------------------
    # ASSIGN DRIVER
    # ------------------------------------------------

    cursor.execute(
        """
        UPDATE rides

        SET
            driver_id = ?,
            status = 'driver_assigned'

        WHERE ride_id = ?
          AND status = 'searching_driver'
          AND driver_id IS NULL
        """,
        (
            driver["driver_id"],
            ride_id
        )
    )


    # Prevent two drivers accepting the same ride
    if cursor.rowcount == 0:

        connection.rollback()
        connection.close()

        raise HTTPException(
            status_code=409,
            detail="Another driver has already accepted this ride"
        )


    # Driver is now busy
    cursor.execute(
        """
        UPDATE drivers

        SET is_available = 0

        WHERE driver_id = ?
        """,
        (
            driver["driver_id"],
        )
    )


    connection.commit()


    # ------------------------------------------------
    # GET UPDATED RIDE
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
        """,
        (ride_id,)
    )

    updated_ride = cursor.fetchone()

    connection.close()


    return {

        "success": True,

        "message":
            "Ride accepted successfully",

        "ride":
            dict(updated_ride)
    }

@app.post("/api/driver/rides/{ride_id}/start")
def start_ride(
    ride_id: int,
    driver: dict = Depends(get_current_driver)
):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
          AND driver_id = ?
          AND status = 'driver_assigned'
        """,
        (
            ride_id,
            driver["driver_id"],
        )
    )

    ride = cursor.fetchone()

    if ride is None:
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Ride cannot be started."
        )

    cursor.execute(
        """
        UPDATE rides
        SET status = 'ride_started'
        WHERE ride_id = ?
          AND driver_id = ?
        """,
        (
            ride_id,
            driver["driver_id"],
        )
    )

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
        """,
        (ride_id,)
    )

    updated_ride = cursor.fetchone()

    connection.close()

    return {
        "success": True,
        "message": "Ride started successfully.",
        "ride": dict(updated_ride)
    }
@app.post("/api/driver/rides/{ride_id}/complete")
def complete_ride(
    ride_id: int,
    driver: dict = Depends(get_current_driver)
):
    connection = get_db_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
          AND driver_id = ?
          AND status = 'ride_started'
        """,
        (
            ride_id,
            driver["driver_id"],
        )
    )

    ride = cursor.fetchone()

    if ride is None:
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Ride cannot be completed."
        )

    cursor.execute(
        """
        UPDATE rides
        SET status = 'completed'
        WHERE ride_id = ?
          AND driver_id = ?
        """,
        (
            ride_id,
            driver["driver_id"],
        )
    )

    cursor.execute(
        """
        UPDATE drivers
        SET is_available = 1
        WHERE driver_id = ?
        """,
        (
            driver["driver_id"],
        )
    )

    connection.commit()

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
        """,
        (ride_id,)
    )

    updated_ride = cursor.fetchone()

    connection.close()

    return {
        "success": True,
        "message": "Ride completed successfully.",
        "ride": dict(updated_ride)
    }


# ====================================================
# HOME
# ====================================================

@app.get("/")
def home():

    return {
        "message":
            "Ride Booking Backend is running"
    }


# ====================================================
# TEST
# ====================================================

@app.get("/api/test")
def test_api():

    return {
        "success": True,
        "message":
            "Frontend successfully connected to FastAPI"
    }


# ====================================================
# SIGNUP
# ====================================================

@app.post("/api/signup")
def signup(
    signup_data: SignupRequest
):

    name = signup_data.name.strip()

    email = (
        signup_data.email
        .strip()
        .lower()
    )

    phone = (
        signup_data.phone.strip()
        if signup_data.phone
        else None
    )

    password = signup_data.password


    # ------------------------------------------------
    # BASIC VALIDATION
    # ------------------------------------------------

    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid name"
        )


    if "@" not in email:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )


    connection = get_db_connection()

    cursor = connection.cursor()


    # ------------------------------------------------
    # CHECK EXISTING EMAIL
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT user_id
        FROM users
        WHERE email = ?
        """,
        (email,)
    )


    existing_user = cursor.fetchone()


    if existing_user:

        connection.close()

        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists"
        )


    # ------------------------------------------------
    # HASH PASSWORD
    # ------------------------------------------------

    salt_hex, password_hash_hex = (
        hash_password(password)
    )


    # ------------------------------------------------
    # CREATE USER
    # ------------------------------------------------

    cursor.execute(
        """
        INSERT INTO users (
            name,
            email,
            phone,
            password_hash,
            password_salt
        )

        VALUES (?, ?, ?, ?, ?)
        """,
        (
            name,
            email,
            phone,
            password_hash_hex,
            salt_hex
        )
    )


    connection.commit()


    user_id = cursor.lastrowid


    # ------------------------------------------------
    # CREATE SESSION
    # ------------------------------------------------

    token = secrets.token_urlsafe(32)


    cursor.execute(
        """
        INSERT INTO sessions (
            user_id,
            token
        )

        VALUES (?, ?)
        """,
        (
            user_id,
            token
        )
    )


    connection.commit()


    cursor.execute(
        """
        SELECT
            user_id,
            name,
            email,
            phone,
            created_at

        FROM users

        WHERE user_id = ?
        """,
        (user_id,)
    )


    user = cursor.fetchone()

    connection.close()


    return {

        "success": True,

        "message":
            "Account created successfully",

        "token":
            token,

        "user":
            dict(user)
    }
# ----------------------------------------------------
# DRIVER SIGNUP
# ----------------------------------------------------

@app.post("/api/driver/signup")
def driver_signup(
    signup_data: DriverSignupRequest
):

    name = signup_data.name.strip()

    email = (
        signup_data.email
        .strip()
        .lower()
    )

    phone = signup_data.phone.strip()

    password = signup_data.password

    vehicle_type = (
        signup_data.vehicle_type
        .strip()
        .title()
    )

    vehicle_number = (
        signup_data.vehicle_number
        .strip()
        .upper()
    )


    # ------------------------------------------------
    # BASIC VALIDATION
    # ------------------------------------------------

    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid name"
        )


    if "@" not in email:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address"
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )


    if vehicle_type not in [
        "Bike",
        "Auto",
        "Cab"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Vehicle type must be Bike, Auto or Cab"
        )


    if not vehicle_number:

        raise HTTPException(
            status_code=400,
            detail="Vehicle number is required"
        )


    connection = get_db_connection()

    cursor = connection.cursor()


    # ------------------------------------------------
    # CHECK EXISTING DRIVER
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT driver_id
        FROM drivers
        WHERE email = ?
           OR phone = ?
           OR vehicle_number = ?
        """,
        (
            email,
            phone,
            vehicle_number
        )
    )

    existing_driver = cursor.fetchone()


    if existing_driver:

        connection.close()

        raise HTTPException(
            status_code=409,
            detail=
                "Driver with this email, phone or vehicle number already exists"
        )


    # ------------------------------------------------
    # HASH PASSWORD
    # ------------------------------------------------

    salt_hex, password_hash_hex = (
        hash_password(password)
    )


    # ------------------------------------------------
    # CREATE DRIVER
    # ------------------------------------------------

    cursor.execute(
        """
        INSERT INTO drivers (
            name,
            phone,
            email,
            password_hash,
            password_salt,
            vehicle_type,
            vehicle_number,
            is_available
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            name,
            phone,
            email,
            password_hash_hex,
            salt_hex,
            vehicle_type,
            vehicle_number,
            1
        )
    )


    connection.commit()

    driver_id = cursor.lastrowid


    cursor.execute(
        """
        SELECT
            driver_id,
            name,
            phone,
            email,
            vehicle_type,
            vehicle_number,
            is_available,
            created_at

        FROM drivers

        WHERE driver_id = ?
        """,
        (driver_id,)
    )


    driver = cursor.fetchone()

    connection.close()


    return {

        "success": True,

        "message":
            "Driver account created successfully",

        "driver":
            dict(driver)
    }
# ----------------------------------------------------
# DRIVER LOGIN
# ----------------------------------------------------

@app.post("/api/driver/login")
def driver_login(
    login_data: LoginRequest
):

    email = (
        login_data.email
        .strip()
        .lower()
    )

    password = login_data.password


    # ------------------------------------------------
    # FIND DRIVER
    # ------------------------------------------------

    connection = get_db_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM drivers
        WHERE email = ?
        """,
        (email,)
    )

    driver = cursor.fetchone()


    if not driver:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # ------------------------------------------------
    # VERIFY PASSWORD
    # ------------------------------------------------

    password_correct = verify_password(
        password,
        driver["password_salt"],
        driver["password_hash"]
    )


    if not password_correct:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # ------------------------------------------------
    # CREATE DRIVER SESSION
    # ------------------------------------------------

    token = secrets.token_urlsafe(32)

    cursor.execute(
        """
        INSERT INTO driver_sessions (
            driver_id,
            token
        )

        VALUES (?, ?)
        """,
        (
            driver["driver_id"],
            token
        )
    )

    connection.commit()


    # ------------------------------------------------
    # DRIVER DETAILS
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT
            driver_id,
            name,
            phone,
            email,
            vehicle_type,
            vehicle_number,
            is_available,
            created_at

        FROM drivers

        WHERE driver_id = ?
        """,
        (driver["driver_id"],)
    )

    driver_data = cursor.fetchone()

    connection.close()


    return {

        "success": True,

        "message":
            "Driver login successful",

        "token":
            token,

        "driver":
            dict(driver_data)
    }


# ====================================================
# LOGIN
# ====================================================

@app.post("/api/login")
def login(
    login_data: LoginRequest
):

    email = (
        login_data.email
        .strip()
        .lower()
    )

    password = login_data.password


    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        SELECT *
        FROM users
        WHERE email = ?
        """,
        (email,)
    )


    user = cursor.fetchone()


    if user is None:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    password_correct = verify_password(
        password,
        user["password_salt"],
        user["password_hash"]
    )


    if not password_correct:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )


    # ------------------------------------------------
    # CREATE NEW LOGIN SESSION
    # ------------------------------------------------

    token = secrets.token_urlsafe(32)


    cursor.execute(
        """
        INSERT INTO sessions (
            user_id,
            token
        )

        VALUES (?, ?)
        """,
        (
            user["user_id"],
            token
        )
    )


    connection.commit()


    user_data = {

        "user_id":
            user["user_id"],

        "name":
            user["name"],

        "email":
            user["email"],

        "phone":
            user["phone"],

        "created_at":
            user["created_at"]
    }


    connection.close()


    return {

        "success": True,

        "message":
            "Login successful",

        "token":
            token,

        "user":
            user_data
    }

# ====================================================
# ADMIN LOGIN
# ====================================================

@app.post("/api/admin/login")
def admin_login(
    login_data: AdminLoginRequest
):

    email = (
        login_data.email
        .strip()
        .lower()
    )

    password = login_data.password

    connection = get_db_connection()

    cursor = connection.cursor()

    # ------------------------------------------------
    # FIND ADMIN
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM admins
        WHERE email = ?
        """,
        (
            email,
        )
    )

    admin = cursor.fetchone()

    if admin is None:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # ------------------------------------------------
    # VERIFY PASSWORD
    # ------------------------------------------------

    password_correct = verify_password(
        password,
        admin["password_salt"],
        admin["password_hash"]
    )

    if not password_correct:

        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

        # ------------------------------------------------
    # CREATE ADMIN SESSION
    # ------------------------------------------------

    token = secrets.token_urlsafe(32)

    cursor.execute(
        """
        INSERT INTO admin_sessions (
            admin_id,
            token
        )
        VALUES (?, ?)
        """,
        (
            admin["admin_id"],
            token
        )
    )

    connection.commit()

    # ------------------------------------------------
    # RETURN ADMIN DETAILS
    # ------------------------------------------------

    admin_data = {
        "admin_id": admin["admin_id"],
        "name": admin["name"],
        "email": admin["email"],
        "created_at": admin["created_at"]
    }

    connection.close()

    return {
        "success": True,
        "message": "Admin login successful",
        "token": token,
        "admin": admin_data
    }

# ====================================================
# CURRENT USER
# ====================================================

@app.get("/api/me")
def current_user(
    user: dict = Depends(get_current_user)
):
    return {
        "success": True,
        "user": user
    }


# ====================================================
# LOGOUT
# ====================================================

@app.post("/api/logout")
def logout(
    authorization: Optional[str] = Header(
        default=None
    )
):

    token = get_token_from_header(
        authorization
    )


    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        DELETE FROM sessions
        WHERE token = ?
        """,
        (token,)
    )


    connection.commit()

    connection.close()


    return {

        "success": True,

        "message":
            "Logged out successfully"
    }


# ====================================================
# CREATE RIDE
# ====================================================
@app.post("/api/rides")
def create_ride(
    ride: RideRequest,
    user: dict = Depends(get_current_user)
):


    # ------------------------------------------------
    # USER MUST BE LOGGED IN
    # ------------------------------------------------

   


    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
        """
        INSERT INTO rides (

            user_id,

            pickup,
            pickup_lat,
            pickup_lon,

            destination,
            destination_lat,
            destination_lon,

            distance,
            duration,

            ride_type,
            fare,

            status
        )

        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user["user_id"],

            ride.pickup,
            ride.pickup_lat,
            ride.pickup_lon,

            ride.destination,
            ride.destination_lat,
            ride.destination_lon,

            ride.distance,
            ride.duration,

            ride.ride_type,
            ride.fare,

            "searching_driver"
        )
    )


    connection.commit()


    ride_id = cursor.lastrowid


    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
        """,
        (ride_id,)
    )


    new_ride = cursor.fetchone()

    connection.close()


    return {

        "success": True,

        "message":
            "Ride booked successfully",

        "ride":
            dict(new_ride)
    }
# ====================================================
# CANCEL RIDE
# ====================================================

@app.post("/api/rides/{ride_id}/cancel")
def cancel_ride(
    ride_id: int,
    user: dict = Depends(get_current_user)
):

    connection = get_db_connection()

    cursor = connection.cursor()

    # ------------------------------------------------
    # FIND THE USER'S RIDE
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
          AND user_id = ?
        """,
        (
            ride_id,
            user["user_id"],
        )
    )

    ride = cursor.fetchone()

    if ride is None:

        connection.close()

        raise HTTPException(
            status_code=404,
            detail="Ride not found."
        )

    # ------------------------------------------------
    # CHECK WHETHER RIDE CAN BE CANCELLED
    # ------------------------------------------------

    if ride["status"] not in (
        "searching_driver",
        "driver_assigned"
    ):

        connection.close()

        raise HTTPException(
            status_code=400,
            detail="This ride cannot be cancelled."
        )

    # ------------------------------------------------
    # CANCEL THE RIDE
    # ------------------------------------------------

    cursor.execute(
        """
        UPDATE rides
        SET status = 'cancelled'
        WHERE ride_id = ?
          AND user_id = ?
        """,
        (
            ride_id,
            user["user_id"],
        )
    )

    # ------------------------------------------------
    # MAKE DRIVER AVAILABLE AGAIN
    # ------------------------------------------------

    if ride["driver_id"] is not None:

        cursor.execute(
            """
            UPDATE drivers
            SET is_available = 1
            WHERE driver_id = ?
            """,
            (
                ride["driver_id"],
            )
        )

    connection.commit()

    # ------------------------------------------------
    # GET UPDATED RIDE
    # ------------------------------------------------

    cursor.execute(
        """
        SELECT *
        FROM rides
        WHERE ride_id = ?
        """,
        (ride_id,)
    )

    updated_ride = cursor.fetchone()

    connection.close()

    return {

        "success": True,

        "message":
            "Ride cancelled successfully.",

        "ride":
            dict(updated_ride)
    }


# ====================================================
# GET LOGGED-IN USER'S RIDES
# ====================================================

@app.get("/api/rides")
def get_my_rides(
    user: dict = Depends(get_current_user)
):

    


    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
    """
    SELECT
        rides.*,

        drivers.name AS driver_name,
        drivers.phone AS driver_phone,
        drivers.vehicle_type AS driver_vehicle_type,
        drivers.vehicle_number AS driver_vehicle_number

    FROM rides

    LEFT JOIN drivers
    ON rides.driver_id = drivers.driver_id

    WHERE rides.user_id = ?

    ORDER BY rides.ride_id DESC
    """,
    (
        user["user_id"],
    )
)


    rows = cursor.fetchall()

    connection.close()


    rides = [
        dict(row)
        for row in rows
    ]


    return {

        "success": True,

        "total_rides":
            len(rides),

        "rides":
            rides
    }


# ====================================================
# GET SINGLE RIDE
# ====================================================

@app.get("/api/rides/{ride_id}")
def get_ride(
    ride_id: int,

    authorization: Optional[str] = Header(
        default=None
    )
):

    user = get_current_user(
        authorization
    )


    connection = get_db_connection()

    cursor = connection.cursor()


    cursor.execute(
    """
    SELECT
        rides.*,

        drivers.name AS driver_name,
        drivers.phone AS driver_phone,
        drivers.vehicle_type AS driver_vehicle_type,
        drivers.vehicle_number AS driver_vehicle_number

    FROM rides

    LEFT JOIN drivers
    ON rides.driver_id = drivers.driver_id

    WHERE rides.user_id = ?

    ORDER BY rides.ride_id DESC
    """,
    (
        user["user_id"],
    )
)

    ride = cursor.fetchone()

    connection.close()


    if ride is None:

        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )


    return {

        "success": True,

        "ride":
            dict(ride)
    }