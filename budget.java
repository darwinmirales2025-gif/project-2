import java.util.Scanner;

// Student Event Budget Calculator
// Java version

public class Budget {
    public static void main(String[] args) {
        Scanner input = new Scanner(System.in);

        System.out.println("STUDENT EVENT BUDGET CALCULATOR");
        System.out.println("--------------------------------");

        System.out.print("Enter food expense: ");
        double food = input.nextDouble();

        System.out.print("Enter venue expense: ");
        double venue = input.nextDouble();

        System.out.print("Enter other expenses: ");
        double other = input.nextDouble();

        System.out.print("Enter contribution per student: ");
        double contribution = input.nextDouble();

        System.out.print("Enter number of students: ");
        int students = input.nextInt();

        if (food < 0 || venue < 0 || other < 0 || contribution < 0 || students <= 0) {
            System.out.println("Please enter non-negative expenses/contribution and at least 1 student.");
        } else {
            double totalExpenses = food + venue + other;
            double totalCollection = students * contribution;
            double balance = totalCollection - totalExpenses;

            String status;
            if (balance > 0) {
                status = "SURPLUS";
            } else if (balance == 0) {
                status = "BALANCED";
            } else {
                status = "SHORTAGE";
            }

            System.out.println("\nRESULT");
            System.out.printf("Total Expenses:   P%.2f%n", totalExpenses);
            System.out.printf("Total Collection: P%.2f%n", totalCollection);
            System.out.printf("Balance:          P%.2f%n", balance);
            System.out.println("Status:           " + status);
        }

        input.close();
    }
}
