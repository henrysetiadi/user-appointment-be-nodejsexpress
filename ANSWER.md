1. Handle for Timezone Conflicts
    Convert into UTC first and then checking using local time with preffered timezone of the user and then checking with local time if within working hours or not (8-17) for every user. If the user out of working hours show notification that out of working hours. Im using moment js to check and validate the timezone. You can check logic in Appointment Controller in Backend (user-appointment-be-nodejsexpress).

2.  Optimize database queries
    a.  Using index especially on fields used in where, order by and join
        For example
        - index for appointments.start -> indexed for filtering future appointments
        - index for appointments.creatorId -> indexed for filtering by the creator
        - participants.userId -> indexed for efficiently finding appointments of a user
    b. Using efficient query selection 
        Select only required fields (id, title, start, end)
    c. Using Pagination for Large Data

3.  Additional Features
    If this is real product, i will add feature
    a.  Appointment reminder & Notification
        - email (SendGrid) or sms (Twilio) for notification
        - push notification via mobile/web
        - Calendar Integration Sync with Google Calendar
    b.  Appointment Status & Confirmation System
        - Participants can confirm or decline
        - Auto cancelation if participant dont confirm beofre a deadline
    c.  Meeting Links & Virtual Integration
        - Integrate with zoom, Gmeet or Microsoft Teams
    d.  Roles of user such as 
        -   admin => manage all appointment
        -   manager => schedule and invite appointments
        -   user => only can join appointments

4.  Handle Session Management
    To Handle session can use 
    a.  JWT Authenticated
        Set Token Expiry: Access Token 1h

    b.  Implement Session Expiry and handling auto logout after expired time / 1hour of          
        inactivity