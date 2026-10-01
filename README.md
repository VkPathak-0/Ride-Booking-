this is the test account for the this ride booking application.

{
  "email": "vikash2@example.com",
  "password": "vikash123"
}
tokem:"token": "2UKW36FeVUWjMwol-K1bfJcyylDGGus7dIi_iBV6USU",
"token": "X1ZxgMRT_VXyK6S1a5mKPtdCWyJW99vcd9ZBvp_iEp0"

driver account:
Email: rahuldriver@example.com
Password: rahul123
driver token: xlaYOKX_E0-2iWA86D7gM2nSRkhVGErkGNK-iV-9irs

admin account:
admin@ridebooking.com
password: admin 123
token:"token": "naSV6-GGPZx6M_mykH-JvTvpl8Bg_b60aMZGgdHODnQ"
<!-- -1AoFCt_8L4JtMAfeU8849oR0v2h5XtUiibgQCuJwdY -->


authentication flows:
login -> receive token -> save token -> verify/restore user -> send token with protected requests -> backend identifies that user -> show only the user's rides

authentication ride flow is working;
    ->token stored -> book ride sends bearer token -> backend saves ride with your user_id -> my rides sends bearer token -> backend returns only your rides -> frontend displays the ride

NEXT STEP IS = NAVBAR AUTHENTICATION UI
afterlogin instead of showing login it should show the logged-n user's name and logout button.
    after that we can connect logout properly to /api/logout.

    now we'll implement the actual logout flow:
    Logout click -> /api/logout -> remove token -> clear current user -> navbar changes back to login.

    STEP 1- add handlelogout

# DRIVER ASSIGNMENT
