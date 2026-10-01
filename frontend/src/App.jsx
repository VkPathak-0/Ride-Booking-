import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./App.css";


// ----------------------------------------------------
// Fix Leaflet marker icons in Vite
// ----------------------------------------------------

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",

  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});


// ----------------------------------------------------
// MAP CONTROLLER
// ----------------------------------------------------

function MapController({
  pickupLocation,
  destinationLocation,
  routeCoordinates,
}) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);

      map.fitBounds(bounds, {
        padding: [50, 50],
      });

      return;
    }

    if (pickupLocation && destinationLocation) {
      const bounds = L.latLngBounds(
        [
          pickupLocation.lat,
          pickupLocation.lon,
        ],
        [
          destinationLocation.lat,
          destinationLocation.lon,
        ]
      );

      map.fitBounds(bounds, {
        padding: [50, 50],
      });
    } else if (pickupLocation) {
      map.setView(
        [
          pickupLocation.lat,
          pickupLocation.lon,
        ],
        15
      );
    } else if (destinationLocation) {
      map.setView(
        [
          destinationLocation.lat,
          destinationLocation.lon,
        ],
        15
      );
    }
  }, [
    pickupLocation,
    destinationLocation,
    routeCoordinates,
    map,
  ]);

  return null;
}


// ----------------------------------------------------
// MAIN APP
// ----------------------------------------------------

function App() {
  // ----------------------------------------------------
  // AUTHENTICATION STATES
  // ----------------------------------------------------

  const [authToken, setAuthToken] = useState(
    localStorage.getItem("ridebooking_token") || ""
  );

  const [currentUser, setCurrentUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");

  const [loginPassword, setLoginPassword] = useState("");

  const [authMessage, setAuthMessage] = useState("");
  // ----------------------------------------------------
  // DRIVER AUTHENTICATION STATES
  // ----------------------------------------------------

  const [driverToken, setDriverToken] = useState(
    localStorage.getItem("ridebooking_driver_token") || ""
  );

  const [currentDriver, setCurrentDriver] = useState(null);

  const [driverEmail, setDriverEmail] = useState("");

  const [driverPassword, setDriverPassword] = useState("");

  const [driverAuthMessage, setDriverAuthMessage] = useState("");

  const [driverAuthLoading, setDriverAuthLoading] = useState(false);

  // ----------------------------------------------------
  // ADMIN AUTHENTICATION STATES
  // ----------------------------------------------------

  const [adminToken, setAdminToken] = useState(
    localStorage.getItem("ridebooking_admin_token") || ""
  );

  const [currentAdmin, setCurrentAdmin] = useState(null);

  const [adminEmail, setAdminEmail] = useState("");

  const [adminPassword, setAdminPassword] = useState("");

  const [adminAuthMessage, setAdminAuthMessage] = useState("");

  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

  // ----------------------------------------------------
  // ADMIN DASHBOARD STATE
  // ----------------------------------------------------

  const [dashboardStats, setDashboardStats] = useState(null);

  // ----------------------------------------------------
  // ADMIN USERS STATE
  // ----------------------------------------------------

  const [adminUsers, setAdminUsers] = useState([]);
  // ----------------------------------------------------
  // RESTORE ADMIN SESSION
  // ----------------------------------------------------

  useEffect(() => {

    const savedAdminToken =
      localStorage.getItem("ridebooking_admin_token");

    if (!savedAdminToken) {
      return;
    }

    const restoreAdminSession = async () => {

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/api/admin/me",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${savedAdminToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {

          localStorage.removeItem(
            "ridebooking_admin_token"
          );

          setAdminToken("");

          setCurrentAdmin(null);

          return;
        }

        setAdminToken(
          savedAdminToken
        );

        setCurrentAdmin(
          data.admin
        );

        setCurrentView(
          "admin-dashboard"
        );

      } catch (error) {

        console.error(
          "Admin session restore error:",
          error
        );

      }
    };

    restoreAdminSession();

  }, []);
  // ----------------------------------------------------
  // DRIVER AVAILABLE RIDES STATES
  // ----------------------------------------------------

  const [availableRides, setAvailableRides] = useState([]);

  const [availableRidesLoading, setAvailableRidesLoading] = useState(false);

  const [availableRidesMessage, setAvailableRidesMessage] = useState("");

  // ----------------------------------------------------
  // DRIVER CURRENT RIDE STATE
  // ----------------------------------------------------

  const [currentDriverRide, setCurrentDriverRide] = useState(null);

  // ----------------------------------------------------
  // RESTORE LOGGED-IN USER
  // ----------------------------------------------------

  useEffect(() => {

    const restoreUser = async () => {

      if (!authToken) {
        return;
      }

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/api/me",
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Session expired."
          );
        }

        setCurrentUser(
          data.user
        );

      } catch (error) {

        console.error(
          "Restore user error:",
          error
        );

        localStorage.removeItem(
          "ridebooking_token"
        );

        setAuthToken("");
        setCurrentUser(null);

      }

    };

    restoreUser();

  }, [authToken]);
  // ----------------------------------------------------
  // PAGE VIEW
  // ----------------------------------------------------

  const [currentView, setCurrentView] =
    useState("home");


  // ----------------------------------------------------
  // INPUT VALUES
  // ----------------------------------------------------

  const [pickup, setPickup] =
    useState("");

  const [destination, setDestination] =
    useState("");


  // ----------------------------------------------------
  // SUGGESTIONS
  // ----------------------------------------------------

  const [
    pickupSuggestions,
    setPickupSuggestions,
  ] = useState([]);

  const [
    destinationSuggestions,
    setDestinationSuggestions,
  ] = useState([]);


  // ----------------------------------------------------
  // SELECTED LOCATIONS
  // ----------------------------------------------------

  const [
    pickupLocation,
    setPickupLocation,
  ] = useState(null);

  const [
    destinationLocation,
    setDestinationLocation,
  ] = useState(null);


  // ----------------------------------------------------
  // SEARCH LOADING
  // ----------------------------------------------------

  const [
    pickupLoading,
    setPickupLoading,
  ] = useState(false);

  const [
    destinationLoading,
    setDestinationLoading,
  ] = useState(false);


  // ----------------------------------------------------
  // MESSAGE
  // ----------------------------------------------------

  const [message, setMessage] =
    useState("");


  // ----------------------------------------------------
  // ROUTE STATES
  // ----------------------------------------------------

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState([]);

  const [distance, setDistance] =
    useState(null);

  const [duration, setDuration] =
    useState(null);

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false);


  // ----------------------------------------------------
  // RIDE / FARE STATES
  // ----------------------------------------------------

  const [fares, setFares] =
    useState(null);

  const [
    selectedRide,
    setSelectedRide,
  ] = useState(null);


  // ----------------------------------------------------
  // BOOKING STATES
  // ----------------------------------------------------

  const [
    bookingLoading,
    setBookingLoading,
  ] = useState(false);

  const [
    bookedRide,
    setBookedRide,
  ] = useState(null);


  // ----------------------------------------------------
  // MY RIDES STATES
  // ----------------------------------------------------

  const [rides, setRides] =
    useState([]);

  const [
    ridesLoading,
    setRidesLoading,
  ] = useState(false);

  const [
    ridesError,
    setRidesError,
  ] = useState("");


  // ----------------------------------------------------
  // CALCULATE FARES
  // ----------------------------------------------------

  const calculateFares = (distanceKm) => {

    const bikeFare = Math.max(
      30,
      20 + distanceKm * 8
    );

    const autoFare = Math.max(
      50,
      30 + distanceKm * 12
    );

    const cabFare = Math.max(
      80,
      50 + distanceKm * 18
    );

    return {
      bike: Math.round(bikeFare),
      auto: Math.round(autoFare),
      cab: Math.round(cabFare),
    };
  };


  // ----------------------------------------------------
  // RESET RIDE RESULTS
  // ----------------------------------------------------

  const resetRideResults = () => {

    setRouteCoordinates([]);

    setDistance(null);

    setDuration(null);

    setFares(null);

    setSelectedRide(null);

    setBookedRide(null);

    setMessage("");
  };


  // ----------------------------------------------------
  // SEARCH PICKUP
  // ----------------------------------------------------

  useEffect(() => {

    if (pickup.length < 3) {

      setPickupSuggestions([]);

      return;
    }


    const timer = setTimeout(
      async () => {

        try {

          setPickupLoading(true);

          const response =
            await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                pickup
              )}&countrycodes=in&limit=5`
            );

          const data =
            await response.json();

          setPickupSuggestions(data);

        } catch (error) {

          console.error(
            "Pickup search error:",
            error
          );

        } finally {

          setPickupLoading(false);

        }

      },
      700
    );


    return () =>
      clearTimeout(timer);

  }, [pickup]);


  // ----------------------------------------------------
  // SEARCH DESTINATION
  // ----------------------------------------------------

  useEffect(() => {

    if (destination.length < 3) {

      setDestinationSuggestions([]);

      return;
    }


    const timer = setTimeout(
      async () => {

        try {

          setDestinationLoading(true);

          const response =
            await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                destination
              )}&countrycodes=in&limit=5`
            );

          const data =
            await response.json();

          setDestinationSuggestions(data);

        } catch (error) {

          console.error(
            "Destination search error:",
            error
          );

        } finally {

          setDestinationLoading(false);

        }

      },
      700
    );


    return () =>
      clearTimeout(timer);

  }, [destination]);


  // ----------------------------------------------------
  // SELECT PICKUP
  // ----------------------------------------------------

  const selectPickup = (place) => {

    setPickup(
      place.display_name
    );

    setPickupLocation({
      lat: Number(place.lat),
      lon: Number(place.lon),
    });

    setPickupSuggestions([]);

    resetRideResults();
  };


  // ----------------------------------------------------
  // SELECT DESTINATION
  // ----------------------------------------------------

  const selectDestination = (place) => {

    setDestination(
      place.display_name
    );

    setDestinationLocation({
      lat: Number(place.lat),
      lon: Number(place.lon),
    });

    setDestinationSuggestions([]);

    resetRideResults();
  };


  // ----------------------------------------------------
  // GET ROAD ROUTE
  // ----------------------------------------------------

  const getRoute = async () => {

    if (
      !pickupLocation ||
      !destinationLocation
    ) {

      setMessage(
        "Please select pickup and destination from the suggestions."
      );

      return;
    }


    try {

      setRouteLoading(true);

      setMessage(
        "Finding the best road route..."
      );

      setSelectedRide(null);

      setFares(null);

      setBookedRide(null);


      const pickupCoordinates =
        `${pickupLocation.lon},${pickupLocation.lat}`;

      const destinationCoordinates =
        `${destinationLocation.lon},${destinationLocation.lat}`;


      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${pickupCoordinates};${destinationCoordinates}` +
        `?overview=full&geometries=geojson`;


      const response =
        await fetch(url);


      if (!response.ok) {

        throw new Error(
          "Could not get route from OSRM."
        );

      }


      const data =
        await response.json();


      if (
        data.code !== "Ok" ||
        !data.routes ||
        data.routes.length === 0
      ) {

        setMessage(
          "No road route could be found between these locations."
        );

        return;
      }


      const route =
        data.routes[0];


      const leafletCoordinates =
        route.geometry.coordinates.map(
          ([longitude, latitude]) => [
            latitude,
            longitude,
          ]
        );


      setRouteCoordinates(
        leafletCoordinates
      );


      const distanceInKm =
        route.distance / 1000;


      const durationInMinutes =
        route.duration / 60;


      const roundedDistance =
        Number(
          distanceInKm.toFixed(2)
        );


      const roundedDuration =
        Math.round(
          durationInMinutes
        );


      setDistance(
        roundedDistance
      );


      setDuration(
        roundedDuration
      );


      const calculatedFares =
        calculateFares(
          roundedDistance
        );


      setFares(
        calculatedFares
      );


      setMessage(
        "Route found. Choose your ride."
      );

    } catch (error) {

      console.error(
        "Route error:",
        error
      );


      setMessage(
        "Could not calculate the road route."
      );

    } finally {

      setRouteLoading(false);

    }
  };


  // ----------------------------------------------------
  // SEARCH RIDE
  // ----------------------------------------------------

  const handleSearchRide =
    async () => {

      if (
        !pickupLocation ||
        !destinationLocation
      ) {

        setMessage(
          "Please select pickup and destination from the suggestions."
        );

        return;
      }


      await getRoute();
    };


  // ----------------------------------------------------
  // SELECT RIDE
  // ----------------------------------------------------

  const handleSelectRide =
    (rideType) => {

      if (!fares) {
        return;
      }


      const rideInformation = {

        bike: {
          name: "Bike",
          icon: "🏍️",
          fare: fares.bike,
        },

        auto: {
          name: "Auto",
          icon: "🛺",
          fare: fares.auto,
        },

        cab: {
          name: "Cab",
          icon: "🚕",
          fare: fares.cab,
        },
      };


      setSelectedRide(
        rideInformation[rideType]
      );


      setBookedRide(null);


      setMessage(
        `${rideInformation[rideType].name} selected successfully.`
      );
    };


  // ----------------------------------------------------
  // BOOK RIDE
  // ----------------------------------------------------

  const handleBookRide =
    async () => {

      if (!authToken) {

        setAuthMessage(
          "Please login before booking a ride."
        );

        setCurrentView(
          "login"
        );

        return;
      }

      if (
        !selectedRide ||
        !pickupLocation ||
        !destinationLocation ||
        distance === null ||
        duration === null
      ) {

        setMessage(
          "Please complete the ride details before booking."
        );

        return;
      }


      try {

        setBookingLoading(true);

        setMessage(
          "Booking your ride..."
        );


        const bookingData = {

          pickup:
            pickup,

          pickup_lat:
            pickupLocation.lat,

          pickup_lon:
            pickupLocation.lon,

          destination:
            destination,

          destination_lat:
            destinationLocation.lat,

          destination_lon:
            destinationLocation.lon,

          distance:
            distance,

          duration:
            duration,

          ride_type:
            selectedRide.name,

          fare:
            selectedRide.fare,
        };


        const response =
          await fetch(
            "http://127.0.0.1:8000/api/rides",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },

              body:
                JSON.stringify(
                  bookingData
                ),
            }
          );


        if (!response.ok) {

          throw new Error(
            "Backend rejected the booking."
          );

        }


        const data =
          await response.json();


        if (!data.success) {

          throw new Error(
            data.message ||
            "Ride booking failed."
          );

        }


        setBookedRide(
          data.ride
        );


        setMessage(
          "Ride booked successfully."
        );

      } catch (error) {

        console.error(
          "Booking error:",
          error
        );


        setMessage(
          "Could not book the ride. Please check that the backend is running."
        );

      } finally {

        setBookingLoading(false);

      }
    };


  // ----------------------------------------------------
  // FETCH MY RIDES
  // ----------------------------------------------------

  const fetchMyRides =
    async () => {

      try {

        setRidesLoading(true);

        setRidesError("");


        const response =
          await fetch(
            "http://127.0.0.1:8000/api/rides",
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );


        if (!response.ok) {

          throw new Error(
            "Could not load rides."
          );

        }


        const data =
          await response.json();


        if (!data.success) {

          throw new Error(
            data.message ||
            "Could not load rides."
          );

        }


        setRides(
          data.rides || []
        );

      } catch (error) {

        console.error(
          "My Rides error:",
          error
        );


        setRidesError(
          "Could not load your rides. Please check that the backend is running."
        );

      } finally {

        setRidesLoading(false);

      }
    };



  // ----------------------------------------------------
  // CANCEL CUSTOMER RIDE
  // ----------------------------------------------------

  const handleCancelRide = async (rideId) => {

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/rides/${rideId}/cancel`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {

        alert(
          data.detail ||
          "Unable to cancel ride."
        );

        return;
      }

      alert(
        "Ride cancelled successfully."
      );

      await fetchMyRides();

    } catch (error) {

      console.error(
        "Cancel ride error:",
        error
      );

      alert(
        "Unable to cancel ride."
      );
    }
  };


  // ----------------------------------------------------
  // AUTOMATIC MY RIDES POLLING
  // ----------------------------------------------------

  // useEffect(() => {

  //   if (!authToken) {
  //     return;
  //   }

  //   const interval = setInterval(() => {

  //     fetchMyRides();

  //   }, 5000);

  //   return () => {
  //     clearInterval(interval);
  //   };

  // }, [authToken]);
  // ----------------------------------------------------
  // LOGIN USER
  // ----------------------------------------------------

  const handleLogin = async () => {

    if (!loginEmail || !loginPassword) {
      setAuthMessage(
        "Please enter email and password."
      );
      return;
    }

    try {

      setAuthLoading(true);
      setAuthMessage("");

      const response = await fetch(
        "http://127.0.0.1:8000/api/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: loginEmail,
            password: loginPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Login failed."
        );
      }

      localStorage.setItem(
        "ridebooking_token",
        data.token
      );

      setAuthToken(
        data.token
      );

      setCurrentUser(
        data.user
      );

      setAuthMessage(
        "Login successful."
      );

      setCurrentView(
        "home"
      );

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      setAuthMessage(
        error.message ||
        "Could not login."
      );

    } finally {

      setAuthLoading(false);

    }
  };

  // ----------------------------------------------------
  // DRIVER LOGIN
  // ----------------------------------------------------

  const handleDriverLogin = async () => {

    if (!driverEmail || !driverPassword) {

      setDriverAuthMessage(
        "Please enter driver email and password."
      );

      return;
    }


    try {

      setDriverAuthLoading(true);

      setDriverAuthMessage("");


      const response = await fetch(
        "http://127.0.0.1:8000/api/driver/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: driverEmail,
            password: driverPassword,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Driver login failed."
        );
      }


      localStorage.setItem(
        "ridebooking_driver_token",
        data.token
      );


      setDriverToken(
        data.token
      );


      setCurrentDriver(
        data.driver
      );


      setDriverAuthMessage(
        "Driver login successful."
      );


      setCurrentView(
        "driver-dashboard"
      );


    } catch (error) {

      console.error(
        "Driver login error:",
        error
      );


      setDriverAuthMessage(
        error.message ||
        "Could not login as driver."
      );


    } finally {

      setDriverAuthLoading(false);
    }
  };

  // ----------------------------------------------------
  // ADMIN LOGIN
  // ----------------------------------------------------

  const handleAdminLogin = async () => {

    if (!adminEmail || !adminPassword) {

      setAdminAuthMessage(
        "Please enter admin email and password."
      );

      return;
    }


    try {

      setAdminAuthLoading(true);

      setAdminAuthMessage("");


      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: adminEmail,
            password: adminPassword,
          }),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Admin login failed."
        );
      }


      localStorage.setItem(
        "ridebooking_admin_token",
        data.token
      );


      setAdminToken(
        data.token
      );


      setCurrentAdmin(
        data.admin
      );


      setAdminAuthMessage(
        "Admin login successful."
      );


      setCurrentView(
        "admin-dashboard"
      );


    } catch (error) {

      console.error(
        "Admin login error:",
        error
      );


      setAdminAuthMessage(
        error.message ||
        "Could not login as admin."
      );


    } finally {

      setAdminAuthLoading(false);

    }
  };
  // ----------------------------------------------------
  // ADMIN LOGOUT
  // ----------------------------------------------------

  const handleAdminLogout = () => {

    localStorage.removeItem(
      "ridebooking_admin_token"
    );

    setAdminToken("");

    setCurrentAdmin(null);

    setCurrentView(
      "admin-login"
    );
  };
  // ----------------------------------------------------
  // FETCH ADMIN DASHBOARD
  // ----------------------------------------------------

  const fetchAdminDashboard = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/dashboard",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to load admin dashboard."
        );
      }

      setDashboardStats(
        data.dashboard
      );

    } catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );

    }
  };

    // ----------------------------------------------------
  // FETCH ADMIN USERS
  // ----------------------------------------------------

  const fetchAdminUsers = async () => {

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/admin/users",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to load users."
        );
      }

      setAdminUsers(
        data.users || []
      );

    } catch (error) {

      console.error(
        "Admin users error:",
        error
      );

    }
  };

  // ----------------------------------------------------
  // LOAD ADMIN DASHBOARD DATA
  // ----------------------------------------------------

  useEffect(() => {

    if (
      currentView !== "admin-dashboard" ||
      !adminToken
    ) {
      return;
    }

    fetchAdminDashboard();
    fetchAdminUsers();

  }, [currentView, adminToken]);

  // ----------------------------------------------------
  // LOAD AVAILABLE RIDES FOR DRIVER
  // ----------------------------------------------------

  const loadAvailableRides = async () => {

    if (!driverToken) {
      setAvailableRidesMessage(
        "Driver is not logged in."
      );
      return;
    }


    try {

      setAvailableRidesLoading(true);
      setAvailableRidesMessage("");


      const response = await fetch(
        "http://127.0.0.1:8000/api/driver/available-rides",
        {
          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not load available rides."
        );
      }


      setAvailableRides(
        data.rides || []
      );


      if (!data.rides || data.rides.length === 0) {
        setAvailableRidesMessage(
          "No available rides right now."
        );
      }


    } catch (error) {

      console.error(
        "Available rides error:",
        error
      );

      setAvailableRidesMessage(
        error.message ||
        "Could not load available rides."
      );


    } finally {

      setAvailableRidesLoading(false);
    }
  };

  // ----------------------------------------------------
  // LOAD DRIVER CURRENT RIDE
  // ----------------------------------------------------

  const loadCurrentDriverRide = async () => {

    if (!driverToken) {
      return;
    }

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/driver/current-ride",
        {
          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not load current ride."
        );
      }

      setCurrentDriverRide(
        data.ride || null
      );

    } catch (error) {

      console.error(
        "Current driver ride error:",
        error
      );

    }
  };

  const handleToggleAvailability = async () => {

    const newAvailability =
      !currentDriver.is_available;

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/driver/availability?is_available=${newAvailability}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.detail || "Unable to update availability.");
        return;
      }

      setCurrentDriver({
        ...currentDriver,
        is_available: data.is_available,
      });

    } catch (error) {

      console.error(
        "Availability update error:",
        error
      );

      alert("Unable to update availability.");

    }
  };

  // ----------------------------------------------------
  // ACCEPT RIDE
  // ----------------------------------------------------

  const handleAcceptRide = async (rideId) => {

    if (!driverToken) {
      setAvailableRidesMessage(
        "Driver is not logged in."
      );
      return;
    }

    try {

      setAvailableRidesMessage(
        "Accepting ride..."
      );

      const response = await fetch(
        `http://127.0.0.1:8000/api/driver/rides/${rideId}/accept`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not accept ride."
        );
      }

      setAvailableRidesMessage(
        "Ride accepted successfully."
      );
      setCurrentDriverRide(
        data.ride || null
      );

      setAvailableRides(
        availableRides.filter(
          (ride) => ride.ride_id !== rideId
        )
      );

    } catch (error) {

      console.error(
        "Accept ride error:",
        error
      );

      setAvailableRidesMessage(
        error.message ||
        "Could not accept ride."
      );
    }
  };
  // ----------------------------------------------------
  // START RIDE
  // ----------------------------------------------------

  const handleStartRide = async (rideId) => {

    if (!driverToken) {
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/driver/rides/${rideId}/start`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not start ride."
        );
      }

      setCurrentDriverRide(
        data.ride
      );

    } catch (error) {

      console.error(
        "Start ride error:",
        error
      );

      setAvailableRidesMessage(
        error.message ||
        "Could not start ride."
      );
    }
  };
  // ----------------------------------------------------
  // COMPLETE RIDE
  // ----------------------------------------------------

  const handleCompleteRide = async (rideId) => {

    if (!driverToken) {
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/api/driver/rides/${rideId}/complete`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${driverToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Could not complete ride."
        );
      }

      setCurrentDriverRide(
        data.ride
      );

    } catch (error) {

      console.error(
        "Complete ride error:",
        error
      );

      setAvailableRidesMessage(
        error.message ||
        "Could not complete ride."
      );
    }
  };
  // ----------------------------------------------------
  // LOGOUT USER
  // ----------------------------------------------------

  const handleLogout = async () => {

    try {

      if (authToken) {

        await fetch(
          "http://127.0.0.1:8000/api/logout",
          {
            method: "POST",

            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

      }

    } catch (error) {

      console.error(
        "Logout error:",
        error
      );

    } finally {

      localStorage.removeItem(
        "ridebooking_token"
      );

      setAuthToken("");

      setCurrentUser(null);

      setLoginEmail("");

      setLoginPassword("");

      setAuthMessage("");

      setCurrentView("home");

    }

  };

  // ----------------------------------------------------
  // OPEN MY RIDES
  // ----------------------------------------------------

  const openMyRides = async () => {

    if (!authToken) {

      setAuthMessage(
        "Please login to view your rides."
      );

      setCurrentView(
        "login"
      );

      return;
    }

    setCurrentView(
      "rides"
    );

    await fetchMyRides();
  };


  // ----------------------------------------------------
  // OPEN HOME
  // ----------------------------------------------------

  const openHome = () => {

    setCurrentView(
      "home"
    );
  };


  // ----------------------------------------------------
  // SHORTEN LONG LOCATION NAME
  // ----------------------------------------------------

  const shortLocation =
    (location) => {

      if (!location) {
        return "";
      }


      const parts =
        location.split(",");


      return parts
        .slice(0, 2)
        .join(",");
    };


  // ----------------------------------------------------
  // FORMAT STATUS
  // ----------------------------------------------------

  const formatStatus =
    (status) => {

      if (!status) {
        return "";
      }


      return status
        .replaceAll("_", " ")
        .replace(
          /\b\w/g,
          (letter) =>
            letter.toUpperCase()
        );
    };

  const getRideProgress =
    (status) => {

      const steps = [
        "searching_driver",
        "driver_assigned",
        "ride_started",
        "completed",
      ];

      if (status === "cancelled") {
        return -1;
      }

      return steps.indexOf(
        status
      );
    };

  // ----------------------------------------------------
  // UI
  // ----------------------------------------------------

  return (

    <div className="app">


      {/* NAVBAR */}

      <header className="navbar">

        <div
          className="logo"
          onClick={openHome}
          style={{
            cursor: "pointer",
          }}
        >
          RideGo
        </div>


        <nav>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openHome();
            }}
          >
            Home
          </a>


          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              openMyRides();
            }}
          >
            My Rides
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView("driver-login");
            }}
          >
            Driver Login
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView("admin-login");
            }}
          >
            Admin Login
          </a>


          {currentUser ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span
                style={{
                  fontWeight: "600",
                }}
              >
                {currentUser.name}
              </span>

              <button
                className="login-btn"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              className="login-btn"
              onClick={() => setCurrentView("login")}
            >
              Login
            </button>
          )}

        </nav>

      </header>

      {/* ================================================ */}
      {/* DRIVER LOGIN VIEW */}
      {/* ================================================ */}

      {currentView === "driver-login" && (

        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "30px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "30px",
              border: "1px solid #ddd",
              borderRadius: "14px",
              background: "#fff",
            }}
          >

            <h2>
              Driver Login
            </h2>


            <input
              type="email"
              placeholder="Driver email"
              value={driverEmail}
              onChange={(e) =>
                setDriverEmail(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "20px",
                marginBottom: "12px",
              }}
            />


            <input
              type="password"
              placeholder="Password"
              value={driverPassword}
              onChange={(e) =>
                setDriverPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
              }}
            />


            <button
              type="button"
              onClick={handleDriverLogin}
              disabled={driverAuthLoading}
              style={{
                width: "100%",
                padding: "12px",
                cursor: "pointer",
              }}
            >

              {driverAuthLoading
                ? "Logging in..."
                : "Login as Driver"}

            </button>


            {driverAuthMessage && (

              <p
                style={{
                  marginTop: "15px",
                }}
              >
                {driverAuthMessage}
              </p>

            )}


            <button
              type="button"
              onClick={() =>
                setCurrentView("home")
              }
              style={{
                marginTop: "15px",
                width: "100%",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Back to Home
            </button>

          </div>

        </div>

      )}

      {/* ================================================ */}
      {/* ADMIN LOGIN VIEW */}
      {/* ================================================ */}

      {currentView === "admin-login" && (

        <div
          style={{
            minHeight: "80vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "30px",
          }}
        >

          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              padding: "30px",
              border: "1px solid #ddd",
              borderRadius: "14px",
              background: "#fff",
            }}
          >

            <h2>
              Admin Login
            </h2>

            <p>
              Login to access the RideGo administration panel.
            </p>


            <input
              type="email"
              placeholder="Admin email"
              value={adminEmail}
              onChange={(e) =>
                setAdminEmail(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "20px",
                marginBottom: "12px",
                boxSizing: "border-box",
              }}
            />


            <input
              type="password"
              placeholder="Password"
              value={adminPassword}
              onChange={(e) =>
                setAdminPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />


            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={adminAuthLoading}
              style={{
                width: "100%",
                padding: "12px",
                cursor: adminAuthLoading
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "600",
              }}
            >

              {adminAuthLoading
                ? "Logging in..."
                : "Login as Admin"}

            </button>


            {adminAuthMessage && (

              <p
                style={{
                  marginTop: "15px",
                }}
              >
                {adminAuthMessage}
              </p>

            )}


            <button
              type="button"
              onClick={() =>
                setCurrentView("home")
              }
              style={{
                marginTop: "15px",
                width: "100%",
                padding: "10px",
                cursor: "pointer",
              }}
            >
              Back to Home
            </button>

          </div>

        </div>

      )}

      {/* ================================================ */}
      {/* ADMIN DASHBOARD */}
      {/* ================================================ */}

      {currentView === "admin-dashboard" && (

        <div
          style={{
            minHeight: "80vh",
            padding: "40px",
          }}
        >

          <h1>
            Admin Dashboard
          </h1>

          <p>
            Welcome, {currentAdmin?.name || "Admin"}
          </p>

          <p>
            Email: {currentAdmin?.email || ""}
          </p>

          <hr />

          <p>
            Admin panel is working successfully.
          </p>

          {dashboardStats && (

            <div
              style={{
                marginTop: "30px",
              }}
            >

              <h2>
                Dashboard Overview
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >

                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Total Users</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.total_users}
                  </p>
                </div>


                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Total Drivers</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.total_drivers}
                  </p>
                </div>


                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Total Rides</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.total_rides}
                  </p>
                </div>


                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Completed Rides</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.completed_rides}
                  </p>
                </div>


                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Active Rides</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.active_rides}
                  </p>
                </div>


                <div
                  style={{
                    padding: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#f8f9fa",
                  }}
                >
                  <h3>Cancelled Rides</h3>
                  <p
                    style={{
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {dashboardStats.cancelled_rides}
                  </p>
                </div>

              </div>
            </div>

          )}

                    {adminUsers.length > 0 && (

            <div
              style={{
                marginTop: "40px",
              }}
            >

              <h2>
                Registered Users
              </h2>

              <div
                style={{
                  overflowX: "auto",
                  marginTop: "20px",
                }}
              >

                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                  }}
                >

                  <thead>

                    <tr>

                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        User ID
                      </th>

                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Email
                      </th>

                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Phone
                      </th>

                      <th
                        style={{
                          border: "1px solid #ddd",
                          padding: "10px",
                          textAlign: "left",
                        }}
                      >
                        Created At
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {adminUsers.map((user) => (

                      <tr key={user.user_id}>

                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                          }}
                        >
                          {user.user_id}
                        </td>

                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                          }}
                        >
                          {user.name}
                        </td>

                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                          }}
                        >
                          {user.email}
                        </td>

                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                          }}
                        >
                          {user.phone || "-"}
                        </td>

                        <td
                          style={{
                            border: "1px solid #ddd",
                            padding: "10px",
                          }}
                        >
                          {user.created_at}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

          )}

          <button
            type="button"
            onClick={handleAdminLogout}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              cursor: "pointer",
              fontWeight: "600",
            }}
          >
            Logout
          </button>

        </div>

      )}


      {/* ================================================ */}
      {/* DRIVER DASHBOARD VIEW */}
      {/* ================================================ */}

      {currentView === "driver-dashboard" && currentDriver && (

        <div
          style={{
            minHeight: "80vh",
            padding: "40px",
          }}
        >

          <h2>
            Driver Dashboard
          </h2>

          <div
            style={{
              marginTop: "20px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              maxWidth: "500px",
            }}
          >

            <h3>
              Welcome, {currentDriver.name}
            </h3>

            <p>
              <strong>Email:</strong> {currentDriver.email}
            </p>

            <p>
              <strong>Phone:</strong> {currentDriver.phone}
            </p>

            <p>
              <strong>Vehicle:</strong> {currentDriver.vehicle_type}
            </p>

            <p>
              <strong>Vehicle Number:</strong> {currentDriver.vehicle_number}
            </p>
            <p>
              <strong>Vehicle Number:</strong> {currentDriver.vehicle_number}
            </p>

            <div
              style={{
                marginTop: "15px",
                padding: "12px",
                background: "#f5f5f5",
                borderRadius: "8px",
              }}
            >
              <strong>Driver Status:</strong>{" "}
              {currentDriver.is_available
                ? "Online"
                : "Offline"}

              <button
                onClick={handleToggleAvailability}
                style={{
                  marginLeft: "15px",
                  padding: "8px 14px",
                  cursor: "pointer"
                }}
              >
                {currentDriver.is_available
                  ? "Go Offline"
                  : "Go Online"}
              </button>
            </div>

          </div>

          <div
            style={{
              marginTop: "30px",
              maxWidth: "700px",
            }}
          >
            <div
              style={{
                marginTop: "30px",
                padding: "20px",
                border: "1px solid #ddd",
                borderRadius: "12px",
                maxWidth: "700px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                }}
              >
                <h3>
                  Current Ride
                </h3>

                <button
                  type="button"
                  onClick={loadCurrentDriverRide}
                >
                  Load Current Ride
                </button>
              </div>


              {currentDriverRide ? (

                <div>

                  <p>
                    <strong>Ride ID:</strong> {currentDriverRide.ride_id}
                  </p>

                  <p>
                    <strong>Pickup:</strong> {currentDriverRide.pickup}
                  </p>

                  <p>
                    <strong>Destination:</strong> {currentDriverRide.destination}
                  </p>

                  <p>
                    <strong>Vehicle:</strong> {currentDriverRide.ride_type}
                  </p>

                  <p>
                    <strong>Fare:</strong> ₹{currentDriverRide.fare}
                  </p>

                  <p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {currentDriverRide.status
                        .replaceAll("_", " ")
                        .replace(
                          /\b\w/g,
                          (letter) => letter.toUpperCase()
                        )}
                    </p>
                  </p>
                  {currentDriverRide.status === "driver_assigned" && (

                    <button
                      type="button"
                      onClick={() =>
                        handleStartRide(currentDriverRide.ride_id)
                      }
                    >
                      Start Ride
                    </button>

                  )}
                  {currentDriverRide.status === "ride_started" && (

                    <button
                      type="button"
                      onClick={() =>
                        handleCompleteRide(currentDriverRide.ride_id)
                      }
                    >
                      Complete Ride
                    </button>

                  )}

                </div>

              ) : (

                <p>
                  No current ride loaded.
                </p>

              )}

            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3>
                Available Rides
              </h3>

              <button
                type="button"
                onClick={loadAvailableRides}
                disabled={availableRidesLoading}
              >
                {availableRidesLoading
                  ? "Loading..."
                  : "Load Available Rides"}
              </button>
            </div>


            {availableRidesMessage && (
              <p>
                {availableRidesMessage}
              </p>
            )}

            {/* this is drivers available rides section */}
            {availableRides.map((ride) => (

              <div
                key={ride.ride_id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >

                <h4>
                  Ride #{ride.ride_id}
                </h4>

                <p>
                  <strong>Pickup:</strong> {ride.pickup}
                </p>

                <p>
                  <strong>Destination:</strong> {ride.destination}
                </p>

                <p>
                  <strong>Vehicle:</strong> {ride.ride_type}
                </p>

                <p>
                  <strong>Fare:</strong> ₹{ride.fare}
                </p>

                <p>
                  <strong>Distance:</strong> {ride.distance_km} km
                </p>
                <button
                  type="button"
                  onClick={() => handleAcceptRide(ride.ride_id)}
                >
                  Accept Ride
                </button>

              </div>

            ))}

          </div>

        </div>

      )}
      {/* ================================================ */}
      {/* HOME VIEW */}
      {/* ================================================ */}

      {currentView === "home" && (

        <>

          <main className="hero">


            {/* LEFT SIDE */}

            <div className="hero-left">


              <p className="small-title">
                FAST • SAFE • AFFORDABLE
              </p>


              <h1>
                Your ride,
                <br />
                your way.
              </h1>


              <p className="description">
                Book a bike, auto or cab in just a few clicks.
              </p>


              <div className="booking-card">


                <h2>
                  Where do you want to go?
                </h2>


                {/* PICKUP */}

                <div className="location-search">


                  <div className="input-group">


                    <span className="pickup-dot"></span>


                    <input
                      type="text"
                      placeholder="Enter pickup location"
                      value={pickup}
                      onChange={(e) => {

                        setPickup(
                          e.target.value
                        );

                        setPickupLocation(
                          null
                        );

                        resetRideResults();

                      }}
                    />


                  </div>


                  {pickupLoading && (

                    <div className="search-status">
                      Searching...
                    </div>

                  )}


                  {pickupSuggestions.length > 0 && (

                    <div className="suggestions">


                      {pickupSuggestions.map(
                        (place) => (

                          <div
                            className="suggestion-item"
                            key={
                              place.place_id
                            }
                            onClick={() =>
                              selectPickup(
                                place
                              )
                            }
                          >

                            <span className="suggestion-icon">
                              📍
                            </span>

                            <span>
                              {
                                place.display_name
                              }
                            </span>

                          </div>

                        )
                      )}


                    </div>

                  )}


                </div>


                <div className="route-line"></div>


                {/* DESTINATION */}

                <div className="location-search">


                  <div className="input-group">


                    <span className="destination-dot"></span>


                    <input
                      type="text"
                      placeholder="Enter destination"
                      value={
                        destination
                      }
                      onChange={(e) => {

                        setDestination(
                          e.target.value
                        );

                        setDestinationLocation(
                          null
                        );

                        resetRideResults();

                      }}
                    />


                  </div>


                  {destinationLoading && (

                    <div className="search-status">
                      Searching...
                    </div>

                  )}


                  {destinationSuggestions.length > 0 && (

                    <div className="suggestions">


                      {destinationSuggestions.map(
                        (place) => (

                          <div
                            className="suggestion-item"
                            key={
                              place.place_id
                            }
                            onClick={() =>
                              selectDestination(
                                place
                              )
                            }
                          >

                            <span className="suggestion-icon">
                              📍
                            </span>

                            <span>
                              {
                                place.display_name
                              }
                            </span>

                          </div>

                        )
                      )}


                    </div>

                  )}


                </div>


                {/* SEARCH BUTTON */}

                <button
                  className="search-btn"
                  onClick={
                    handleSearchRide
                  }
                  disabled={
                    routeLoading
                  }
                >

                  {routeLoading
                    ? "Finding Route..."
                    : "Search Ride"}

                </button>


                {/* MESSAGE */}

                {message && (

                  <p className="message">
                    {message}
                  </p>

                )}


                {/* TRIP DETAILS */}

                {distance !== null &&
                  duration !== null && (

                    <div
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "14px",
                        borderRadius:
                          "10px",
                        background:
                          "#f5f5f5",
                      }}
                    >

                      <div
                        style={{
                          fontWeight:
                            "600",
                          marginBottom:
                            "8px",
                        }}
                      >
                        Trip Details
                      </div>


                      <div>
                        🛣 Distance:{" "}
                        <strong>
                          {distance} km
                        </strong>
                      </div>


                      <div
                        style={{
                          marginTop:
                            "5px",
                        }}
                      >
                        ⏱ Estimated time:{" "}
                        <strong>
                          {duration} minutes
                        </strong>
                      </div>

                    </div>

                  )}


                {/* SELECTED RIDE */}

                {selectedRide && (

                  <div
                    style={{
                      marginTop:
                        "15px",
                      padding:
                        "15px",
                      border:
                        "2px solid #111",
                      borderRadius:
                        "12px",
                      background:
                        "#ffffff",
                    }}
                  >

                    <div
                      style={{
                        fontWeight:
                          "700",
                        marginBottom:
                          "6px",
                      }}
                    >
                      ✓ Selected Ride
                    </div>


                    <div
                      style={{
                        fontSize:
                          "18px",
                      }}
                    >
                      {
                        selectedRide.icon
                      }{" "}
                      {
                        selectedRide.name
                      }
                    </div>


                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "22px",
                        fontWeight:
                          "700",
                      }}
                    >
                      ₹{
                        selectedRide.fare
                      }
                    </div>


                    {!bookedRide && (

                      <button
                        className="search-btn"
                        onClick={
                          handleBookRide
                        }
                        disabled={
                          bookingLoading
                        }
                        style={{
                          marginTop:
                            "15px",
                          width:
                            "100%",
                        }}
                      >

                        {bookingLoading
                          ? "Booking..."
                          : `Book ${selectedRide.name}`}

                      </button>

                    )}


                  </div>

                )}


                {/* BOOKING SUCCESS */}

                {bookedRide && (

                  <div
                    style={{
                      marginTop:
                        "15px",
                      padding:
                        "16px",
                      borderRadius:
                        "12px",
                      background:
                        "#f2f7f2",
                      border:
                        "2px solid #333",
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          "18px",
                        fontWeight:
                          "700",
                        marginBottom:
                          "10px",
                      }}
                    >
                      ✅ Ride Booked
                    </div>


                    <div>
                      Ride ID:{" "}
                      <strong>
                        #{
                          bookedRide.ride_id
                        }
                      </strong>
                    </div>


                    <div
                      style={{
                        marginTop:
                          "5px",
                      }}
                    >
                      Ride:{" "}
                      <strong>
                        {
                          bookedRide.ride_type
                        }
                      </strong>
                    </div>


                    <div
                      style={{
                        marginTop:
                          "5px",
                      }}
                    >
                      Fare:{" "}
                      <strong>
                        ₹{
                          bookedRide.fare
                        }
                      </strong>
                    </div>


                    <div
                      style={{
                        marginTop:
                          "5px",
                      }}
                    >
                      Status:{" "}
                      <strong>
                        {
                          formatStatus(
                            bookedRide.status
                          )
                        }
                      </strong>
                    </div>


                    <div
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      🔎 Searching for a driver...
                    </div>


                    <button
                      onClick={
                        openMyRides
                      }
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "10px 16px",
                        border:
                          "1px solid #111",
                        borderRadius:
                          "8px",
                        background:
                          "#fff",
                        cursor:
                          "pointer",
                        fontWeight:
                          "600",
                      }}
                    >
                      View My Rides
                    </button>


                  </div>

                )}


              </div>


            </div>


            {/* MAP */}

            <div className="hero-right">


              <div className="map-wrapper">


                <MapContainer
                  center={[
                    25.5941,
                    85.1376,
                  ]}
                  zoom={13}
                  scrollWheelZoom={
                    true
                  }
                  className="map"
                >


                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />


                  <MapController
                    pickupLocation={
                      pickupLocation
                    }
                    destinationLocation={
                      destinationLocation
                    }
                    routeCoordinates={
                      routeCoordinates
                    }
                  />


                  {pickupLocation && (

                    <Marker
                      position={[
                        pickupLocation.lat,
                        pickupLocation.lon,
                      ]}
                    >

                      <Popup>

                        <strong>
                          Pickup
                        </strong>

                        <br />

                        {pickup}

                      </Popup>

                    </Marker>

                  )}


                  {destinationLocation && (

                    <Marker
                      position={[
                        destinationLocation.lat,
                        destinationLocation.lon,
                      ]}
                    >

                      <Popup>

                        <strong>
                          Destination
                        </strong>

                        <br />

                        {
                          destination
                        }

                      </Popup>

                    </Marker>

                  )}


                  {routeCoordinates.length > 0 && (

                    <Polyline
                      positions={
                        routeCoordinates
                      }
                      pathOptions={{
                        weight: 6,
                        opacity:
                          0.8,
                      }}
                    />

                  )}


                </MapContainer>


              </div>


            </div>


          </main>


          {/* RIDE TYPES */}

          <section className="ride-types">


            <h2>
              Choose your ride
            </h2>


            {!fares && (

              <p
                style={{
                  textAlign:
                    "center",
                  marginBottom:
                    "20px",
                }}
              >
                Enter your pickup and destination to see ride prices.
              </p>

            )}


            <div className="ride-container">


              {/* BIKE */}

              <div
                className="ride-card"
                onClick={() =>
                  fares &&
                  handleSelectRide(
                    "bike"
                  )
                }
                style={{
                  cursor:
                    fares
                      ? "pointer"
                      : "default",

                  opacity:
                    fares
                      ? 1
                      : 0.6,

                  border:
                    selectedRide?.name ===
                      "Bike"
                      ? "3px solid #111"
                      : undefined,

                  transform:
                    selectedRide?.name ===
                      "Bike"
                      ? "scale(1.03)"
                      : "scale(1)",

                  transition:
                    "all 0.2s ease",
                }}
              >

                <div className="ride-icon">
                  🏍️
                </div>

                <h3>
                  Bike
                </h3>

                <p>
                  Quick and affordable
                </p>


                {fares && (

                  <h3>
                    ₹{
                      fares.bike
                    }
                  </h3>

                )}


                {selectedRide?.name ===
                  "Bike" && (

                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✓ Selected
                    </div>

                  )}


              </div>


              {/* AUTO */}

              <div
                className="ride-card"
                onClick={() =>
                  fares &&
                  handleSelectRide(
                    "auto"
                  )
                }
                style={{
                  cursor:
                    fares
                      ? "pointer"
                      : "default",

                  opacity:
                    fares
                      ? 1
                      : 0.6,

                  border:
                    selectedRide?.name ===
                      "Auto"
                      ? "3px solid #111"
                      : undefined,

                  transform:
                    selectedRide?.name ===
                      "Auto"
                      ? "scale(1.03)"
                      : "scale(1)",

                  transition:
                    "all 0.2s ease",
                }}
              >

                <div className="ride-icon">
                  🛺
                </div>

                <h3>
                  Auto
                </h3>

                <p>
                  Comfortable city rides
                </p>


                {fares && (

                  <h3>
                    ₹{
                      fares.auto
                    }
                  </h3>

                )}


                {selectedRide?.name ===
                  "Auto" && (

                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✓ Selected
                    </div>

                  )}


              </div>


              {/* CAB */}

              <div
                className="ride-card"
                onClick={() =>
                  fares &&
                  handleSelectRide(
                    "cab"
                  )
                }
                style={{
                  cursor:
                    fares
                      ? "pointer"
                      : "default",

                  opacity:
                    fares
                      ? 1
                      : 0.6,

                  border:
                    selectedRide?.name ===
                      "Cab"
                      ? "3px solid #111"
                      : undefined,

                  transform:
                    selectedRide?.name ===
                      "Cab"
                      ? "scale(1.03)"
                      : "scale(1)",

                  transition:
                    "all 0.2s ease",
                }}
              >

                <div className="ride-icon">
                  🚕
                </div>

                <h3>
                  Cab
                </h3>

                <p>
                  Comfortable and private
                </p>


                {fares && (

                  <h3>
                    ₹{
                      fares.cab
                    }
                  </h3>

                )}


                {selectedRide?.name ===
                  "Cab" && (

                    <div
                      style={{
                        marginTop:
                          "8px",
                        fontWeight:
                          "600",
                      }}
                    >
                      ✓ Selected
                    </div>

                  )}


              </div>


            </div>


          </section>


        </>

      )}
      {/* ================================================ */}
      {/* LOGIN VIEW */}
      {/* ================================================ */}

      {currentView === "login" && (

        <main
          style={{
            maxWidth: "450px",
            margin: "60px auto",
            padding: "30px",
            minHeight: "65vh",
          }}
        >

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "14px",
              padding: "30px",
              background: "#ffffff",
            }}
          >

            <h1
              style={{
                marginBottom: "10px",
              }}
            >
              Login
            </h1>

            <p
              style={{
                marginBottom: "25px",
              }}
            >
              Login to continue booking your ride.
            </p>

            <input
              type="email"
              placeholder="Email address"
              value={loginEmail}
              onChange={(e) =>
                setLoginEmail(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "15px",
                boxSizing: "border-box",
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) =>
                setLoginPassword(e.target.value)
              }
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "20px",
                boxSizing: "border-box",
              }}
            />

            <button
              type="button"
              onClick={handleLogin}
              disabled={authLoading}
              style={{
                width: "100%",
                padding: "12px",
                cursor: authLoading
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "600",
              }}
            >
              {authLoading
                ? "Logging in..."
                : "Login"}
            </button>

            {authMessage && (
              <p
                style={{
                  marginTop: "15px",
                }}
              >
                {authMessage}
              </p>
            )}

            <button
              type="button"
              onClick={openHome}
              style={{
                marginTop: "20px",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              ← Back to Home
            </button>

          </div>

        </main>

      )}

      {/* ================================================ */}
      {/* MY RIDES VIEW */}
      {/* ================================================ */}

      {currentView === "rides" && (

        <main
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "50px 20px",
            minHeight: "75vh",
          }}
        >


          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: "20px",
              marginBottom:
                "30px",
              flexWrap:
                "wrap",
            }}
          >

            <div>

              <p
                className="small-title"
                style={{
                  marginBottom:
                    "8px",
                }}
              >
                YOUR JOURNEYS
              </p>

              <h1
                style={{
                  margin: 0,
                }}
              >
                My Rides
              </h1>

            </div>


            <button
              onClick={
                fetchMyRides
              }
              disabled={
                ridesLoading
              }
              style={{
                padding:
                  "11px 18px",
                borderRadius:
                  "8px",
                border:
                  "1px solid #111",
                background:
                  "#ffffff",
                cursor:
                  "pointer",
                fontWeight:
                  "600",
              }}
            >

              {ridesLoading
                ? "Refreshing..."
                : "↻ Refresh"}

            </button>


          </div>


          {/* LOADING */}

          {ridesLoading && (

            <div
              style={{
                padding:
                  "30px",
                textAlign:
                  "center",
              }}
            >
              Loading your rides...
            </div>

          )}


          {/* ERROR */}

          {ridesError && (

            <div
              style={{
                padding:
                  "16px",
                border:
                  "1px solid #999",
                borderRadius:
                  "10px",
                marginBottom:
                  "20px",
              }}
            >
              {ridesError}
            </div>

          )}


          {/* NO RIDES */}

          {!ridesLoading &&
            !ridesError &&
            rides.length === 0 && (

              <div
                style={{
                  padding:
                    "50px 20px",
                  textAlign:
                    "center",
                  border:
                    "1px solid #ddd",
                  borderRadius:
                    "15px",
                  background:
                    "#fff",
                }}
              >

                <div
                  style={{
                    fontSize:
                      "45px",
                    marginBottom:
                      "15px",
                  }}
                >
                  🚕
                </div>

                <h2>
                  No rides yet
                </h2>

                <p>
                  Book your first ride and it will appear here.
                </p>

                <button
                  className="search-btn"
                  onClick={
                    openHome
                  }
                  style={{
                    marginTop:
                      "10px",
                  }}
                >
                  Book a Ride
                </button>

              </div>

            )}


          {/* SAVED RIDES */}

          {!ridesLoading &&
            rides.length > 0 && (

              <div
                style={{
                  display:
                    "grid",
                  gap:
                    "18px",
                }}
              >

                {rides.map(
                  (ride) => (

                    <div
                      key={
                        ride.ride_id
                      }
                      style={{
                        background:
                          "#ffffff",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "15px",
                        padding:
                          "22px",
                        boxShadow:
                          "0 4px 15px rgba(0,0,0,0.05)",
                      }}
                    >


                      <div
                        style={{
                          display:
                            "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "flex-start",
                          gap:
                            "20px",
                          flexWrap:
                            "wrap",
                        }}
                      >


                        <div>

                          <div
                            style={{
                              fontSize:
                                "14px",
                              color:
                                "#666",
                              marginBottom:
                                "5px",
                            }}
                          >
                            Ride #
                            {
                              ride.ride_id
                            }
                          </div>


                          <h2
                            style={{
                              margin:
                                "0 0 5px 0",
                            }}
                          >

                            {ride.ride_type ===
                              "Bike" &&
                              "🏍️ "}

                            {ride.ride_type ===
                              "Auto" &&
                              "🛺 "}

                            {ride.ride_type ===
                              "Cab" &&
                              "🚕 "}

                            {
                              ride.ride_type
                            }

                          </h2>

                        </div>


                        <div
                          style={{
                            fontSize:
                              "24px",
                            fontWeight:
                              "700",
                          }}
                        >
                          ₹{
                            ride.fare
                          }
                        </div>


                      </div>


                      <div
                        style={{
                          marginTop:
                            "20px",
                        }}
                      >

                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "10px",
                            marginBottom:
                              "12px",
                          }}
                        >

                          <span>
                            🟢
                          </span>

                          <div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#777",
                              }}
                            >
                              PICKUP
                            </div>

                            <strong>
                              {
                                shortLocation(
                                  ride.pickup
                                )
                              }
                            </strong>

                          </div>

                        </div>


                        <div
                          style={{
                            display:
                              "flex",
                            gap:
                              "10px",
                          }}
                        >

                          <span>
                            🔴
                          </span>

                          <div>

                            <div
                              style={{
                                fontSize:
                                  "12px",
                                color:
                                  "#777",
                              }}
                            >
                              DESTINATION
                            </div>

                            <strong>
                              {
                                shortLocation(
                                  ride.destination
                                )
                              }
                            </strong>

                          </div>

                        </div>


                      </div>


                      <div
                        style={{
                          display:
                            "flex",
                          flexWrap:
                            "wrap",
                          gap:
                            "10px",
                          marginTop:
                            "20px",
                          paddingTop:
                            "15px",
                          borderTop:
                            "1px solid #eee",
                        }}
                      >


                        <span
                          style={{
                            padding:
                              "7px 12px",
                            background:
                              "#f5f5f5",
                            borderRadius:
                              "20px",
                          }}
                        >
                          🛣{" "}
                          {
                            ride.distance
                          }{" "}
                          km
                        </span>


                        <span
                          style={{
                            padding:
                              "7px 12px",
                            background:
                              "#f5f5f5",
                            borderRadius:
                              "20px",
                          }}
                        >
                          ⏱{" "}
                          {
                            ride.duration
                          }{" "}
                          min
                        </span>


                        <span
                          style={{
                            padding:
                              "7px 12px",
                            background:
                              "#f5f5f5",
                            borderRadius:
                              "20px",
                          }}
                        >
                          Status:{" "}
                          <strong>
                            {
                              formatStatus(
                                ride.status
                              )
                            }
                          </strong>
                        </span>



                      </div>

                      {/* RIDE PROGRESS */}

                      <div
                        style={{
                          marginTop: "18px",
                          padding: "15px",
                          background: "#fafafa",
                          border: "1px solid #eee",
                          borderRadius: "10px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: "700",
                            marginBottom: "12px",
                          }}
                        >
                          Ride Progress
                        </div>

                        {ride.status === "cancelled" ? (

                          <div
                            style={{
                              fontWeight: "600",
                            }}
                          >
                            ✕ Ride Cancelled
                          </div>

                        ) : (

                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "8px",
                              alignItems: "center",
                            }}
                          >

                            {[
                              ["Booked", 0],
                              ["Driver Assigned", 1],
                              ["Ride Started", 2],
                              ["Completed", 3],
                            ].map(
                              ([label, step], index) => {

                                const currentStep =
                                  getRideProgress(
                                    ride.status
                                  );

                                return (
                                  <span
                                    key={label}
                                    style={{
                                      fontWeight:
                                        step <= currentStep
                                          ? "700"
                                          : "400",
                                      color:
                                        step <= currentStep
                                          ? "#111"
                                          : "#999",
                                    }}
                                  >
                                    {step <= currentStep
                                      ? "✓ "
                                      : "○ "}

                                    {label}

                                    {index < 3 &&
                                      " → "}
                                  </span>
                                );
                              }
                            )}

                          </div>

                        )}

                      </div>

                      {/* CANCEL RIDE */}

                      {(ride.status === "searching_driver" ||
                        ride.status === "driver_assigned") && (

                          <button
                            type="button"
                            onClick={() =>
                              handleCancelRide(
                                ride.ride_id
                              )
                            }
                            style={{
                              marginTop: "15px",
                              padding: "10px 16px",
                              borderRadius: "8px",
                              border: "1px solid #111",
                              background: "#ffffff",
                              cursor: "pointer",
                              fontWeight: "600",
                            }}
                          >
                            Cancel Ride
                          </button>

                        )}

                      {ride.driver_id && (

                        <div
                          style={{
                            marginTop: "15px",
                            padding: "15px",
                            border: "1px solid #ddd",
                            borderRadius: "10px",
                          }}
                        >

                          <h4
                            style={{
                              marginBottom: "10px",
                            }}
                          >
                            Driver Details
                          </h4>

                          <p>
                            <strong>Name:</strong>{" "}
                            {ride.driver_name}
                          </p>

                          <p>
                            <strong>Phone:</strong>{" "}
                            {ride.driver_phone}
                          </p>

                          <p>
                            <strong>Vehicle:</strong>{" "}
                            {ride.driver_vehicle_type}
                          </p>

                          <p>
                            <strong>Vehicle Number:</strong>{" "}
                            {ride.driver_vehicle_number}
                          </p>

                        </div>

                      )}

                      {ride.created_at && (

                        <div
                          style={{
                            marginTop:
                              "12px",
                            fontSize:
                              "12px",
                            color:
                              "#777",
                          }}
                        >
                          Booked:{" "}
                          {
                            ride.created_at
                          }
                        </div>

                      )}


                    </div>

                  )
                )}


              </div>

            )}


        </main>

      )}


    </div>
  );
}


export default App;