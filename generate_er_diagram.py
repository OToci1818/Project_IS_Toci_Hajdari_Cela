"""
ER Diagram Generator for Project Management System
Generates a PDF containing the Entity-Relationship diagram based on Prisma schema
"""

import os
import sys

# Add Graphviz to PATH on Windows
graphviz_path = r"C:\Program Files\Graphviz\bin"
if os.path.exists(graphviz_path):
    os.environ["PATH"] = graphviz_path + os.pathsep + os.environ.get("PATH", "")

from graphviz import Digraph

def create_er_diagram():
    # Create a new directed graph with specific settings for ER diagrams
    dot = Digraph('ER_Diagram', format='pdf')
    dot.attr(rankdir='TB', splines='ortho', nodesep='0.8', ranksep='1.2')
    dot.attr('node', shape='none', fontname='Arial', fontsize='10')
    dot.attr('edge', fontname='Arial', fontsize='9')

    # Define entity tables using HTML-like labels
    entities = {
        'User': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#E8F4FD">
                <TR><TD COLSPAN="2" BGCOLOR="#2196F3"><FONT COLOR="white"><B>User</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">email</TD><TD ALIGN="LEFT">String (unique)</TD></TR>
                <TR><TD ALIGN="LEFT">passwordHash</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">fullName</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">role</TD><TD ALIGN="LEFT">UserRole</TD></TR>
                <TR><TD ALIGN="LEFT">avatarUrl</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">isActive</TD><TD ALIGN="LEFT">Boolean</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">lastLoginAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
                <TR><TD ALIGN="LEFT">deletedAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
            </TABLE>>''',

        'Session': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FFF3E0">
                <TR><TD COLSPAN="2" BGCOLOR="#FF9800"><FONT COLOR="white"><B>Session</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">userId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">userAgent</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">ip</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">expiresAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">revoked</TD><TD ALIGN="LEFT">Boolean</TD></TR>
            </TABLE>>''',

        'Project': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#E8F5E9">
                <TR><TD COLSPAN="2" BGCOLOR="#4CAF50"><FONT COLOR="white"><B>Project</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">title</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">description</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">courseCode</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">courseId</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectType</TD><TD ALIGN="LEFT">ProjectType</TD></TR>
                <TR><TD ALIGN="LEFT">teamLeaderId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">status</TD><TD ALIGN="LEFT">ProjectStatus</TD></TR>
                <TR><TD ALIGN="LEFT">deadlineDate</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">deletedAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
            </TABLE>>''',

        'ProjectUser': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FCE4EC">
                <TR><TD COLSPAN="2" BGCOLOR="#E91E63"><FONT COLOR="white"><B>ProjectUser</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">userId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">role</TD><TD ALIGN="LEFT">UserRole</TD></TR>
                <TR><TD ALIGN="LEFT">invitedById</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">inviteStatus</TD><TD ALIGN="LEFT">InviteStatus</TD></TR>
                <TR><TD ALIGN="LEFT">joinedAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
            </TABLE>>''',

        'Task': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#F3E5F5">
                <TR><TD COLSPAN="2" BGCOLOR="#9C27B0"><FONT COLOR="white"><B>Task</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">title</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">description</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">priority</TD><TD ALIGN="LEFT">TaskPriority</TD></TR>
                <TR><TD ALIGN="LEFT">status</TD><TD ALIGN="LEFT">TaskStatus</TD></TR>
                <TR><TD ALIGN="LEFT">assigneeId</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">ordinal</TD><TD ALIGN="LEFT">Int</TD></TR>
                <TR><TD ALIGN="LEFT">createdById</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">dueDate</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
                <TR><TD ALIGN="LEFT">isDeleted</TD><TD ALIGN="LEFT">Boolean</TD></TR>
            </TABLE>>''',

        'TaskHistory': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#EDE7F6">
                <TR><TD COLSPAN="2" BGCOLOR="#673AB7"><FONT COLOR="white"><B>TaskHistory</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">taskId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">changedById</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">previousStatus</TD><TD ALIGN="LEFT">TaskStatus?</TD></TR>
                <TR><TD ALIGN="LEFT">newStatus</TD><TD ALIGN="LEFT">TaskStatus?</TD></TR>
                <TR><TD ALIGN="LEFT">previousAssignee</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">newAssignee</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">comment</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'File': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#E0F7FA">
                <TR><TD COLSPAN="2" BGCOLOR="#00BCD4"><FONT COLOR="white"><B>File</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">taskId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">uploadedBy</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">filename</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">s3Key</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">sizeBytes</TD><TD ALIGN="LEFT">BigInt</TD></TR>
                <TR><TD ALIGN="LEFT">mimeType</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'Comment': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#E0F2F1">
                <TR><TD COLSPAN="2" BGCOLOR="#009688"><FONT COLOR="white"><B>Comment</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">taskId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">authorId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">content</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'ActivityLog': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#ECEFF1">
                <TR><TD COLSPAN="2" BGCOLOR="#607D8B"><FONT COLOR="white"><B>ActivityLog</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">userId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">action</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">resourceType</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">resourceId</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">details</TD><TD ALIGN="LEFT">Json?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'Notification': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FFF8E1">
                <TR><TD COLSPAN="2" BGCOLOR="#FFC107"><FONT COLOR="black"><B>Notification</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">userId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">type</TD><TD ALIGN="LEFT">NotificationType</TD></TR>
                <TR><TD ALIGN="LEFT">title</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">message</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">isRead</TD><TD ALIGN="LEFT">Boolean</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">taskId</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">actorId</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">metadata</TD><TD ALIGN="LEFT">Json?</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">readAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
            </TABLE>>''',

        'Course': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FFEBEE">
                <TR><TD COLSPAN="2" BGCOLOR="#F44336"><FONT COLOR="white"><B>Course</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">title</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">code</TD><TD ALIGN="LEFT">String (unique)</TD></TR>
                <TR><TD ALIGN="LEFT">description</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">semester</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">year</TD><TD ALIGN="LEFT">Int</TD></TR>
                <TR><TD ALIGN="LEFT">professorId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">isActive</TD><TD ALIGN="LEFT">Boolean</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'CourseEnrollment': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FFCDD2">
                <TR><TD COLSPAN="2" BGCOLOR="#D32F2F"><FONT COLOR="white"><B>CourseEnrollment</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">courseId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">studentId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">enrolledAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'ProjectGrade': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#C8E6C9">
                <TR><TD COLSPAN="2" BGCOLOR="#388E3C"><FONT COLOR="white"><B>ProjectGrade</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID (FK, unique)</TD></TR>
                <TR><TD ALIGN="LEFT">professorId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">gradeType</TD><TD ALIGN="LEFT">GradeType</TD></TR>
                <TR><TD ALIGN="LEFT">numericGrade</TD><TD ALIGN="LEFT">Int?</TD></TR>
                <TR><TD ALIGN="LEFT">letterGrade</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">feedback</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">gradedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'FinalSubmission': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#DCEDC8">
                <TR><TD COLSPAN="2" BGCOLOR="#689F38"><FONT COLOR="white"><B>FinalSubmission</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID (FK, unique)</TD></TR>
                <TR><TD ALIGN="LEFT">description</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">status</TD><TD ALIGN="LEFT">SubmissionStatus</TD></TR>
                <TR><TD ALIGN="LEFT">submittedAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
                <TR><TD ALIGN="LEFT">submittedById</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">reviewedAt</TD><TD ALIGN="LEFT">DateTime?</TD></TR>
                <TR><TD ALIGN="LEFT">reviewedById</TD><TD ALIGN="LEFT">UUID? (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">reviewComment</TD><TD ALIGN="LEFT">String?</TD></TR>
            </TABLE>>''',

        'FinalSubmissionFile': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#F0F4C3">
                <TR><TD COLSPAN="2" BGCOLOR="#AFB42B"><FONT COLOR="white"><B>FinalSubmissionFile</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">submissionId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">filename</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">filepath</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">sizeBytes</TD><TD ALIGN="LEFT">BigInt</TD></TR>
                <TR><TD ALIGN="LEFT">mimeType</TD><TD ALIGN="LEFT">String?</TD></TR>
                <TR><TD ALIGN="LEFT">uploadedBy</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'ProjectReview': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#B2DFDB">
                <TR><TD COLSPAN="2" BGCOLOR="#00796B"><FONT COLOR="white"><B>ProjectReview</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">projectId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">professorId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">content</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',

        'Announcement': '''<
            <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#B3E5FC">
                <TR><TD COLSPAN="2" BGCOLOR="#0288D1"><FONT COLOR="white"><B>Announcement</B></FONT></TD></TR>
                <TR><TD ALIGN="LEFT"><U>id</U></TD><TD ALIGN="LEFT">UUID (PK)</TD></TR>
                <TR><TD ALIGN="LEFT">courseId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">professorId</TD><TD ALIGN="LEFT">UUID (FK)</TD></TR>
                <TR><TD ALIGN="LEFT">title</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">content</TD><TD ALIGN="LEFT">String</TD></TR>
                <TR><TD ALIGN="LEFT">isPinned</TD><TD ALIGN="LEFT">Boolean</TD></TR>
                <TR><TD ALIGN="LEFT">createdAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
                <TR><TD ALIGN="LEFT">updatedAt</TD><TD ALIGN="LEFT">DateTime</TD></TR>
            </TABLE>>''',
    }

    # Add all entity nodes
    for entity_name, label in entities.items():
        dot.node(entity_name, label=label)

    # Define relationships with cardinality labels
    relationships = [
        # User relationships
        ('User', 'Session', '1', 'N', 'has'),
        ('User', 'Project', '1', 'N', 'leads'),
        ('User', 'ProjectUser', '1', 'N', 'member'),
        ('User', 'ProjectUser', '1', 'N', 'invites'),
        ('User', 'Task', '1', 'N', 'assigned'),
        ('User', 'Task', '1', 'N', 'creates'),
        ('User', 'TaskHistory', '1', 'N', 'changes'),
        ('User', 'File', '1', 'N', 'uploads'),
        ('User', 'Comment', '1', 'N', 'authors'),
        ('User', 'ActivityLog', '1', 'N', 'logs'),
        ('User', 'Notification', '1', 'N', 'receives'),
        ('User', 'Course', '1', 'N', 'teaches'),
        ('User', 'CourseEnrollment', '1', 'N', 'enrolls'),
        ('User', 'ProjectGrade', '1', 'N', 'grades'),
        ('User', 'FinalSubmission', '1', 'N', 'submits'),
        ('User', 'FinalSubmission', '1', 'N', 'reviews'),
        ('User', 'ProjectReview', '1', 'N', 'writes'),
        ('User', 'Announcement', '1', 'N', 'posts'),
        ('User', 'FinalSubmissionFile', '1', 'N', 'uploads'),

        # Project relationships
        ('Project', 'ProjectUser', '1', 'N', 'has'),
        ('Project', 'Task', '1', 'N', 'contains'),
        ('Project', 'Notification', '1', 'N', 'triggers'),
        ('Project', 'ProjectGrade', '1', '1', 'graded'),
        ('Project', 'FinalSubmission', '1', '1', 'submission'),
        ('Project', 'ProjectReview', '1', 'N', 'reviewed'),

        # Course relationships
        ('Course', 'Project', '1', 'N', 'has'),
        ('Course', 'CourseEnrollment', '1', 'N', 'enrollments'),
        ('Course', 'Announcement', '1', 'N', 'announcements'),

        # Task relationships
        ('Task', 'TaskHistory', '1', 'N', 'history'),
        ('Task', 'File', '1', 'N', 'attachments'),
        ('Task', 'Comment', '1', 'N', 'comments'),
        ('Task', 'Notification', '1', 'N', 'notifications'),

        # FinalSubmission relationships
        ('FinalSubmission', 'FinalSubmissionFile', '1', 'N', 'files'),
    ]

    # Add edges with relationship labels
    added_edges = set()
    for rel in relationships:
        edge_key = (rel[0], rel[1])
        if edge_key not in added_edges:
            label = f"{rel[2]}:{rel[3]}"
            dot.edge(rel[0], rel[1], label=label, arrowhead='none' if rel[3] == '1' else 'crow')
            added_edges.add(edge_key)

    # Add legend
    legend = '''<
        <TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" BGCOLOR="#FAFAFA">
            <TR><TD COLSPAN="2" BGCOLOR="#424242"><FONT COLOR="white"><B>LEGEND</B></FONT></TD></TR>
            <TR><TD ALIGN="LEFT">PK</TD><TD ALIGN="LEFT">Primary Key</TD></TR>
            <TR><TD ALIGN="LEFT">FK</TD><TD ALIGN="LEFT">Foreign Key</TD></TR>
            <TR><TD ALIGN="LEFT"><U>underline</U></TD><TD ALIGN="LEFT">Primary Key field</TD></TR>
            <TR><TD ALIGN="LEFT">1:N</TD><TD ALIGN="LEFT">One-to-Many</TD></TR>
            <TR><TD ALIGN="LEFT">1:1</TD><TD ALIGN="LEFT">One-to-One</TD></TR>
            <TR><TD ALIGN="LEFT">?</TD><TD ALIGN="LEFT">Nullable field</TD></TR>
        </TABLE>>'''
    dot.node('Legend', label=legend)

    # Add title
    title = '''<
        <TABLE BORDER="0" CELLBORDER="0" CELLSPACING="0">
            <TR><TD><FONT POINT-SIZE="24"><B>Project Management System</B></FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="14">Entity-Relationship Diagram</FONT></TD></TR>
            <TR><TD><FONT POINT-SIZE="10">Based on Prisma Schema</FONT></TD></TR>
        </TABLE>>'''
    dot.node('Title', label=title, shape='none')

    # Render the diagram
    output_path = dot.render('er_diagram', cleanup=True)
    print(f"ER Diagram generated successfully: {output_path}")
    return output_path

if __name__ == '__main__':
    create_er_diagram()
