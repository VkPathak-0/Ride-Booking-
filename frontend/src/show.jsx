                      </div >

    {/* RIDE PROGRESS */ }

    < div
style = {{
    marginTop:
    "18px",
        padding:
    "15px",
        background:
    "#fafafa",
        border:
    "1px solid #eee",
        borderRadius:
    "10px",
                        }}
                      >
    <div
        style={{
            fontWeight:
                "700",
            marginBottom:
                "12px",
        }}
    >
        Ride Progress
    </div>

{
    ride.status ===
    "cancelled" ? (

    <div
        style={{
            fontWeight:
                "600",
        }}
    >
        ✕ Ride Cancelled
    </div>

) : (

    <div
        style={{
            display:
                "flex",
            flexWrap:
                "wrap",
            gap:
                "8px",
            alignItems:
                "center",
        }}
    >

        {[
            [
                "Booked",
                0,
            ],
            [
                "Driver Assigned",
                1,
            ],
            [
                "Ride Started",
                2,
            ],
            [
                "Completed",
                3,
            ],
        ].map(
            (
                [label, step],
                index
            ) => {

                const currentStep =
                    getRideProgress(
                        ride.status
                    );

                return (
                    <span
                        key={
                            label
                        }
                        style={{
                            fontWeight:
                                step <=
                                    currentStep
                                    ? "700"
                                    : "400",
                            color:
                                step <=
                                    currentStep
                                    ? "#111"
                                    : "#999",
                        }}
                    >
                        {step <=
                            currentStep
                            ? "✓ "
                            : "○ "}

                        {label}

                        {index <
                            3 &&
                            " → "}
                    </span>
                );
            }
        )}

    </div>

)
}

                    

    


{/* CANCEL RIDE */ }

{
    (ride.status === "searching_driver" ||
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

    )
}

{
    ride.driver_id && (

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

    )
}

{
    ride.created_at && (

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

    )
}


                    </div >

                  )
                )}


              </div >

            )}


        </main >

      )}


    </div >
  );
}


export default App;