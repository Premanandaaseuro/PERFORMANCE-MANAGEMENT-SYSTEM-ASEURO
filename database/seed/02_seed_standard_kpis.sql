-- Standard 12 Goals & KPIs Seed Data
INSERT INTO kpi_master (designation, kpi_name, description, weightage, status) VALUES
('Software Engineer', 'Sprint Task Completion', 'Sprint Task Completion - tasks completed within sprint (individual)', 10.0, 'ACTIVE'),
('Software Engineer', 'Deadline Adherence', 'Deadline Adherence - tasks completed on or before deadline', 15.0, 'ACTIVE'),
('Software Engineer', 'Task Quality with Defects', 'Task Quality with Defects - tasks delivered without defects, including reopen and critical issues', 10.0, 'ACTIVE'),
('Software Engineer', 'Prompt Quality', 'Prompt Quality - AI tasks with minimal rework', 15.0, 'ACTIVE'),
('Software Engineer', 'Jira Time Logging', 'Jira Time Logging - days logged properly in Jira', 10.0, 'ACTIVE'),
('Software Engineer', 'Jira Discipline', 'Jira Discipline - status updates, comments, transitions, and ticket hygiene', 5.0, 'ACTIVE'),
('Software Engineer', 'Accountability & Ownership', 'Accountability & Ownership - proactive ownership, updates, issue handling, team collaboration, and engagement', 10.0, 'ACTIVE'),
('Software Engineer', 'Leave Pattern', 'Leave Pattern - planned leaves should be 95% of total leaves; unplanned leaves should not exceed 5% in a year including sick leave', 5.0, 'ACTIVE'),
('Software Engineer', 'Team Collaboration and Engagement', 'Team Collaboration and Engagement', 5.0, 'ACTIVE'),
('Software Engineer', 'Punctuality', 'Punctuality', 5.0, 'ACTIVE'),
('Software Engineer', 'New Initiatives and Participation', 'New Initiatives and Participation', 5.0, 'ACTIVE'),
('Software Engineer', 'Rewards', 'Rewards', 5.0, 'ACTIVE')
ON CONFLICT DO NOTHING;
