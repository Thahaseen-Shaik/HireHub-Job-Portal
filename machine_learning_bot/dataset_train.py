
def create_dataset():
    data = {
        "intent": [],
        "question": [],
        "answer": []
    }

    # Helper to add batches of training data
    def add_intent(intent, questions, answer):
        for q in questions:
            data["intent"].append(intent)
            data["question"].append(q)
            data["answer"].append(answer)

    # 1. Greetings
    add_intent("greeting", 
               ["hi", "hello", "hey", "hola", "greetings", "good morning", "is anyone there?"], 
               "Hello! I am your HireHub ML Assistant. How can I help you today?")

    # 2. Working Hours
    add_intent("working_hours", 
               ["what are your hours?", "when do you open?", "closing time", "operational hours", "are you open on weekends?"], 
               "Our platform is available 24/7, but our support team is available Mon-Fri, 9 AM to 5 PM.")

    # 3. Process
    add_intent("process", 
               ["how does this work?", "what is the process?", "tell me the steps", "how to use this portal", "workflow of hirehub"], 
               "The process is simple: Create an account, upload your resume, explore jobs, and apply. Some jobs might require an AI interview or a technical test.")

    # 4. Farewell
    add_intent("farewell", 
               ["bye", "goodbye", "see you later", "thanks bye", "exit chat"], 
               "Goodbye! Best of luck with your career journey at HireHub!")

    # Terms and Conditions
    add_intent("terms_conditions", 
               ["what are the terms?", "terms and conditions", "user agreement", "what about terms and conditions", "terms of service", "legal terms", "agreements"], 
               "You can read our full Terms and Conditions by visiting the 'Terms' link in the website footer. They outline user rights, platform usage, and our data policies.")

    # 5. Login
    add_intent("login", 
               ["how to login", "where can I log in?", "signin help", "cant access my account", "login button"], 
               "To login, simply click the 'Login' button at the top right of the navigation bar.")

    # 6. Register
    add_intent("register", 
               ["how to register", "how do I create an account?", "signup", "join hirehub", "create profile"], 
               "You can register by clicking the 'Register' button on the top right of the homepage.")

    # 7. Password Reset
    add_intent("forgot_password", 
               ["forgot my password", "how to reset password?", "change password", "password recovery", "i forgot my credentials"], 
               "Navigate to the Login page and click 'Forgot Password' to reset it via your registered email.")

    # 8. Applying for jobs
    add_intent("apply_job", 
               ["how to apply", "applying for a job", "how do i send my resume", "start application", "help with applying"], 
               "Navigate to the 'Explore Jobs' section, select a job you like, and click the 'Apply Now' button.")

    # 9. Subscriptions
    add_intent("subscriptions", 
               ["what are the subscription plans", "do I have to pay", "premium features", "membership cost", "pricing details"], 
               "You can view our premium plans in the Subscriptions page. Basic job searching is free!")

    # 10. Interviews
    add_intent("interviews", 
               ["how to take an interview", "where are my assessments", "ai interview help", "view pending interviews", "technical test"], 
               "You can find your assessments and AI interviews in your User Dashboard under the 'Interviews' section.")

    # 11. Companies
    add_intent("companies", 
               ["how to find companies", "where are employers", "view hiring organizations", "company list", "verified employers"], 
               "Browse the 'Employers' tab to find verified companies hiring right now.")

    # 12. Contact
    add_intent("contact", 
               ["how to contact", "how to contact support", "customer care", "reach out to team", "email support"], 
               "You can contact us through the 'Contact' page or email support@hirehub.com.")

    # 13. About
    add_intent("about", 
               ["about hirehub", "what is hirehub", "who are you", "platform details", "mission of hirehub"], 
               "HireHub is a state-of-the-art job portal that uses Machine Learning to match talent with the right opportunities.")

    # 14. Job Openings
    add_intent("explore_jobs", 
               ["current job openings", "what jobs are open", "current openings", "open jobs", "see openings", "list of jobs"], 
               "You can view all live openings by clicking 'Explore Jobs' in the main navigation menu.")

    # 15. Admin - Users
    add_intent("admin_users", 
               ["manage users", "how to delete users as admin", "block a user", "view user list admin", "user management admin"], 
               "Admin: You can manage user accounts (block/delete) in the 'Users' section of the Admin Portal.")

    # 16. Admin - Companies
    add_intent("admin_companies", 
               ["manage companies admin", "approve companies", "verify employer", "pending company registrations", "reject company"], 
               "Admin: Approve or reject company registrations in the Admin Portal under the 'Companies' tab.")

    # 17. Admin - Logs
    add_intent("admin_logs", 
               ["system logs", "where are error logs", "view activity logs", "audit trail admin", "server logs"], 
               "Admin: System activity logs are available in the 'Logs' section of the Admin Dashboard.")

    # 18. Manager - Jobs
    add_intent("manager_jobs", 
               ["create job", "post an opening", "add new vacancy", "manager job posting", "i want to post a job", "how to add a job for my company", "list a new position", "create recruitment post", "post new hiring", "job updates manager", "where to add jobs", "add vacancy", "go to jobs", "open job list", "view posted jobs"], 
               "Manager: Create and manage job openings in the Manager Dashboard under the 'Job Updates' section.")

    # 19. Manager - Applications
    add_intent("manager_applications", 
               ["shortlist candidates", "review applicants", "check resumes manager", "manage applicants", "ats filter", "who applied for the job", "view pending applications", "shortlist someone", "reject application", "candidate management", "filter applications", "show me applications", "open applications list", "go to applications", "navigate to applications", "view applicants"], 
               "Manager: Shortlist or review candidate applications in the 'Applications' tab of your Manager Dashboard.")

    # 20. Manager - Interviews
    add_intent("manager_interviews", 
               ["schedule interviews", "schedule an interview", "book an interview", "set up a meeting", "interview candidate", "organize technical rounds", "manager interview panel", "i want to schedule an interview", "call someone for interview", "setup interview time", "interview scheduler", "interviewer booking", "schedule meeting with candidate", "go to interviews", "open matches", "interview panel"], 
               "Manager: Organize and schedule interviews in the 'Interviews' panel of your Dashboard.")

    # 21. Manager - Confirm Actions
    add_intent("manager_confirm_action", 
               ["confirm that schedule", "schedule it", "confirm the interview", "yes do it", "proceed with scheduling", "looks good confirm", "submit schedule"], 
               "Manager: Confirmation received. I am submitting the request to the database now...")

    # 22. Admin - Navigation
    add_intent("admin_dashboard_nav", ["go to admin dashboard", "show admin stats", "open admin home"], "Admin: Opening Dashboard...")
    add_intent("admin_users_nav", ["manage users", "show all users", "go to user management", "user list admin"], "Admin: Opening User Management...")
    add_intent("admin_companies_nav", ["view companies", "manage company list", "go to companies"], "Admin: Opening Companies...")
    add_intent("admin_logs_nav", ["show system logs", "view activity logs", "check logs admin", "system history"], "Admin: Opening System Logs...")
    add_intent("admin_settings_nav", ["open system settings", "go to global settings", "admin portal settings"], "Admin: Opening Settings...")
    add_intent("admin_applications_nav", ["view all applications", "manage global applicants"], "Admin: Opening Global Applications...")
    add_intent("admin_subscriptions_nav", ["check subscriptions", "manage payments admin", "revenue logs"], "Admin: Opening Subscriptions...")

    # 23. User - Navigation
    add_intent("user_home_nav", ["go to my home", "take me back home", "user dashboard home"], "User: Opening your Home page...")
    add_intent("user_jobs_nav", ["explore jobs", "search for openings", "view job profiles", "go to jobs list"], "User: Opening Job Search...")
    add_intent("user_resume_nav", ["show my resume", "manage my cv", "go to resume builder", "my resume"], "User: Opening your Resume...")
    add_intent("user_interviews_nav", ["check my interviews", "view scheduled meetings", "user interview panel"], "User: Opening your Interviews...")
    add_intent("user_profile_nav", ["go to my profile", "view my account", "user settings profile", "edit my info"], "User: Opening your Profile...")
    add_intent("user_assessments_nav", ["my assessments", "take a test", "exam center"], "User: Opening Assessments...")
    add_intent("user_events_nav", ["view events", "upcoming workshops", "go to events section"], "User: Opening Events...")
    add_intent("user_help_nav", ["user help desk", "get support", "contact admin user"], "User: Opening Help Center...")

    # 24. Manager - Extended Navigation
    add_intent("manager_overview_nav", ["go to dashboard overview", "manager dashboard home", "back to stats"], "Manager: Opening Overview...")
    add_intent("manager_profile_nav", ["view my manager profile", "manager account settings"], "Manager: Opening Profile...")
    add_intent("manager_users_nav", ["go to user management", "manage company members", "view team"], "Manager: Opening User Management...")
    add_intent("manager_tests_nav", ["go to test updates", "check test links", "view candidate scores", "check test status", "open test updates"], "Manager: Opening Test Updates...")
    add_intent("manager_offboarding_nav", ["go to offboarding letters", "send resignation response", "manage exits"], "Manager: Opening Offboarding...")
    add_intent("manager_recent_nav", ["go to recent updates", "what happened lately", "show recent activity"], "Manager: Opening Recent Updates...")

    # 25. Theme Switching
    add_intent("change_theme", 
               ["change theme to arctic", "switch to dark blue theme", "use arctic command", "make it blue",
                "switch to ember", "use ember ledger", "change theme to orange", "make it dark brown",
                "switch to forest theme", "use emerald theme", "make it green", "go to forest mode",
                "switch to default theme", "go back to light mode", "reset theme", "use default style",
                "how to change themes", "can you change the look of the site", "change the UI style"], 
               "I can change the theme for you! Which style would you like to see? (Arctic Command, Ember Ledger, Forest, or Default)")

    # 26. Profile Updates (General / User)
    add_intent("user_update_profile",
               ["change my name to Sarah", "update my phone number", "edit my profile bio", "set my bio as Software Developer",
                "change my headline to Python Expert", "set my display name as Moksha Boya", "headline as Software Architect",
                "living in San Francisco", "current location is Tokyo", "I am currently based in London",
                "set my preferred location to Remote", "looking for jobs in Seattle", "set my skills to React, Node, CSS",
                "add AWS and Cloud to my skills", "proficient in Java and Spring Boot", "born on 1998-05-15",
                "my gender is Male", "languages as English and Spanish", "can speak English and Hindi", "change my name", "update profile",
                "Add education: B.Tech in Computer Science at IIT Madras", "I studied MBA at Stanford University",
                "Add experience: Senior Software Engineer at Google", "worked as a Product Manager at Amazon",
                "interned as a Data Analyst at Microsoft", "Add internship: Frontend Developer at Startup Inc",
                "Add project: HireHub AI Assistant with description 'A powerful job portal bot'", "project is e-commerce site - built with MERN stack",
                "Add Cricket and Chess to my activities", "set my extra curriculars as Music, Photography",
                "Add certification AWS Certified Solutions Architect", "got certification in Google Cloud Professional",
                "set my resume link to https://myresume.com/cv", "update my resume url", "go to my resume", "show my cv"],
               "Okay, updating your profile details as requested...")

    # 27. Manager - Job Creation
    add_intent("manager_create_job",
               ["hire a developer for react", "post a job opening", "create a new job for backend", "add job title as Java Developer",
                "hire react developer with 3 years experience", "i need to post a new opening"],
               "Applying your requirements and posting the job opening now...")

    # 28. Monitor Navs
    add_intent("admin_monitor_nav", ["show live activity admin", "monitor system health", "go to live monitor"], "Admin: Opening Live System Monitor...")
    add_intent("manager_monitor_nav", ["show live activity manager", "monitor hiring performance", "manager live dashboard"], "Manager: Opening Live Activity Feed...")
    add_intent("visitor_monitor_nav", ["show live job trends", "platform statistics", "visitor job monitor"], "Visitor: Opening Public Job Trends...")

    # 29. Image Context Follow-up
    add_intent("image_query_followup", 
               ["tell me about that image", "what is in this screenshot", "explain what i just sent", "what image is this", "elaborate on the upload", "analyze that photo again"], 
               "I'm looking at the last image you shared. Based on my visual scan, I can help you interpret what's on screen or guide you through that specific section.")

    import json
    with open("chat_dataset.json", "w") as f:
        json.dump(data, f, indent=4)
    print(f"Dataset created successfully with {len(data['intent'])} training examples!")

if __name__ == "__main__":
    create_dataset()
