
class Assignment {  // assignment class

    constructor(assignmentName) {  // constructor

        this.assignmentName = assignmentName;
        this.status = "released"; // default to released when created
        this._grade = null; // no grade when released/created

    }


    setGrade(grade) {
        this._grade = grade;

        // update pass / fail status based on grade
        if (grade > 50) {
            this.status = "pass";
        }
        else {
            this.status = "fail";
        }
    }


    getGradeValue() {
        return this._grade;
    }

}


// Observer Class 
class Observer {
    notify(student, assignmentName, status) {
        // Match the style shown in the example output

        if (status === "released") {
            console.log("Observer → " + student.fullName + ", " + assignmentName + " has been released.");
        }

        else if (status === "working") {
            console.log("Observer → " + student.fullName + " is working on " + assignmentName + ".");
        }

        else if (status === "submitted") {
            console.log("Observer → " + student.fullName + " has submitted " + assignmentName + ".");
        }

        else if (status === "final reminder") {
            console.log("Observer → " + student.fullName + ", " + assignmentName + " final reminder.");
        }

        else if (status === "pass") {
            console.log("Observer → " + student.fullName + " has passed " + assignmentName + ".");
        }

        else if (status === "fail") {
            console.log("Observer → " + student.fullName + " has failed " + assignmentName);
        }

        else {
            // fallback for any other status
            console.log("Observer → " + student.fullName + ", " + assignmentName + " is now " + status + ".");
        }
    }
}

// Student Class 
class Student {
    constructor(fullName, email, observer) {  // set all attributes
        this.fullName = fullName;
        this.email = email;
        this.assignmentStatuses = []; // array of Assignment objects
        this.overallGrade = null;
        this._observer = observer;

        // map for all the timers
        this._workTimers = new Map();
    }

    // setters 
    setFullName(newName) {  // set the full name of the student
        this.fullName = newName;
    }

    setEmail(newEmail) {  // set the email of the student
        this.email = newEmail;
    }

    // helpers 
    _findAssignment(assignmentName) {  // find the assignment that is given 
        return this.assignmentStatuses.find((a) => a.assignmentName === assignmentName);
    }


    _ensureAssignmentExists(assignmentName) {  // check if assignment exists
        let assignment = this._findAssignment(assignmentName);

        if (!assignment) {  // assignmnt doesn't exist
            assignment = new Assignment(assignmentName);
            this.assignmentStatuses.push(assignment);  // push it on the list
            this._notifyObserver(assignment);
        }

        return assignment;  // return assignment
    }

    _notifyObserver(assignment) {  // notify all students
        if (this._observer) {
            this._observer.notify(this, assignment.assignmentName, assignment.status);
        }
    }

    _recalculateOverallGrade() {  // recalculate the overall grade
        const graded = this.assignmentStatuses.filter((a) => a.getGradeValue() !== null);  // filter grades for the ones that already have a grade
        if (graded.length === 0) {  // no grade
            this.overallGrade = null;
            return;
        }

        const total = graded.reduce( (sum, a) => sum + a.getGradeValue(), 0);  // add all the values up

        this.overallGrade = total / graded.length;  // get average by dividing
    }


    updateAssignmentStatus(assignmentName, grade) {
        let assignment = this._findAssignment(assignmentName);

        if (!assignment) {
            assignment = new Assignment(assignmentName);
            this.assignmentStatuses.push(assignment);

            // status is "released" by default in Assignment constructor
            this._notifyObserver(assignment);  // notify everyone that it has been released

        }
        else if (typeof grade === "number") {
            assignment.setGrade(grade);
            this._recalculateOverallGrade();  // update overall score for average
            this._notifyObserver(assignment);  // notify that they passed or failed
        }
    }


    getAssignmentStatus(assignmentName) {  // show that they passed or failed
        const assignment = this._findAssignment(assignmentName);
        if (!assignment) {
            return "Hasn't been assigned";
        }

        if (assignment.status === "pass") {
            return "Pass";
        }

        if (assignment.status === "fail") {
            return "Fail";
        }

        // For any other intermediate statuses
        return assignment.status;
    }


    startWorking(assignmentName) {  // student started their work
        const assignment = this._ensureAssignmentExists(assignmentName);

        assignment.status = "working";
        this._notifyObserver(assignment);  // let observer know that student started work on their assignment

        // clear any existing timer for this assignment
        if (this._workTimers.has(assignmentName)) {
            clearTimeout(this._workTimers.get(assignmentName));
            this._workTimers.delete(assignmentName);
        }

        // submit after 500ms
        const timerId = setTimeout(() => {
            // Only auto-submit if not already submitted/graded
            if ( assignment.status === "working" || assignment.status === "final reminder") {
                this.submitAssignment(assignmentName);  // submit it anyways
            }

            this._workTimers.delete(assignmentName);
        }, 500);

        this._workTimers.set(assignmentName, timerId);  // save timer
    }


    submitAssignment(assignmentName) {  // student is done
        const assignment = this._ensureAssignmentExists(assignmentName);

        // clear any "working" timer if it exists
        if (this._workTimers.has(assignmentName)) {
            clearTimeout(this._workTimers.get(assignmentName));
            this._workTimers.delete(assignmentName);
        }

        assignment.status = "submitted";
        this._notifyObserver(assignment);

        // simulate asynchronous grading and give random grade 
        setTimeout(() => {
            const randomGrade = Math.floor(Math.random() * 101); // 0–100
            assignment.setGrade(randomGrade);
            this._recalculateOverallGrade();
            this._notifyObserver(assignment);
        }, 500);

    }

        // get grade
    getGrade() {
        this._recalculateOverallGrade();  // make sure grade is updated
        return this.overallGrade;
    }

    // Called when a reminder is sent for this assignment.
    receiveReminder(assignmentName) {
        const assignment = this._ensureAssignmentExists(assignmentName);

        // mark final reminder
        assignment.status = "final reminder";
        this._notifyObserver(assignment);

        // early submit (this will schedule grading)
        this.submitAssignment(assignmentName);
    }
}


// ClassList (Classlist) 
class ClassList {
    constructor(observer) {
        this.students = [];
        this.observer = observer;
    }


    // print student added notification
    addStudent(student) {
        this.students.push(student);
        console.log(`${student.fullName} has been added to the classlist.`);
    }
    

    removeStudent(studentOrName) {  // remove student by string or object
        const name =
        typeof studentOrName === "string"
            ? studentOrName
            : studentOrName.fullName;

        this.students = this.students.filter((s) => s.fullName !== name);
    }

    findStudentByName(fullName) {  // find by name
        return this.students.find((s) => s.fullName === fullName);
    }

  
    // returns who still needs to submit they're work
    findOutstandingAssignments(assignmentName) {
        const outstandingStatuses = ["released", "working", "final reminder"];

        if (assignmentName) {  // specific assignmnet case
            return this.students
            .filter((student) => {
                const assignment = student.assignmentStatuses.find( (a) => a.assignmentName === assignmentName);

                // If assignment does not exist, treat as outstanding
                if (!assignment) {  // assignment doesn't exist
                    return true;
                }

                // Not yet submitted/graded
                return outstandingStatuses.includes(assignment.status);
            }).map((s) => s.fullName);  // show only names
        }

        // No specific assignment
        return this.students.filter((student) => student.assignmentStatuses.some((a) => outstandingStatuses.includes(a.status))).map((s) => s.fullName);
  }

    // releases assignments to everyone at teh same time
    releaseAssignmentsParallel(assignmentNames) {
        const promises = assignmentNames.map((assignmentName) => {
            return new Promise((resolve) => {
                // simulate asynchronous release with setTimeout
                setTimeout(() => {
                this.students.forEach((student) => {
                student.updateAssignmentStatus(assignmentName);
                });
                resolve();
                }, 0);
            });
        });

        return Promise.all(promises);
  }

    // for all students who have not yet completed the assignment,
    // late reminder
    sendReminder(assignmentName) {
        const outstandingStudents = this.findOutstandingAssignments(assignmentName);

        outstandingStudents.forEach((studentName) => {
            const student = this.findStudentByName(studentName);
            if (student) {
                student.receiveReminder(assignmentName);
            }
        });
    }
}


// code from pdf to run
const observer = new Observer();
const classList = new ClassList(observer);
const s1 = new Student("Alice Smith", "alice@example.com", observer);
const s2 = new Student("Bob Jones", "bob@example.com", observer);
classList.addStudent(s1);
classList.addStudent(s2);

classList.releaseAssignmentsParallel(["A1", "A2"]).then(() => {
    s1.startWorking("A1");
    s2.startWorking("A2");
    setTimeout(() => classList.sendReminder("A1"), 200);
});

// Export classes 
module.exports = { Assignment, Observer, Student, ClassList };
