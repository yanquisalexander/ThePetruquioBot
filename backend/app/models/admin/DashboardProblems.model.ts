
interface Problem {
    id: string;
    title: string;
    description: string;
    severity: ProblemSeverity;
}

export enum ProblemSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
}

class AdminDashboardProblems {
    private static problems: Problem[] = [];

    public static getProblems(): Problem[] {
        return this.problems;
    }

    public static addProblem(problem: Problem): void {
        this.problems.push(problem);
    }

    public static removeProblem(id: string): void {
        this.problems = this.problems.filter((problem) => problem.id !== id);
    }
}

export default AdminDashboardProblems;