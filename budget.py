# Student Event Budget Calculator
# Python version

print("STUDENT EVENT BUDGET CALCULATOR")
print("-" * 32)

try:
    food = float(input("Enter food expense: "))
    venue = float(input("Enter venue expense: "))
    other = float(input("Enter other expenses: "))
    contribution = float(input("Enter contribution per student: "))
    students = int(input("Enter number of students: "))

    if food < 0 or venue < 0 or other < 0 or contribution < 0 or students <= 0:
        print("Please enter non-negative expenses/contribution and at least 1 student.")
    else:
        total_expenses = food + venue + other
        total_collection = students * contribution
        balance = total_collection - total_expenses

        if balance > 0:
            status = "SURPLUS"
        elif balance == 0:
            status = "BALANCED"
        else:
            status = "SHORTAGE"

        print("\nRESULT")
        print(f"Total Expenses:   P{total_expenses:.2f}")
        print(f"Total Collection: P{total_collection:.2f}")
        print(f"Balance:          P{balance:.2f}")
        print(f"Status:           {status}")
except ValueError:
    print("Invalid input. Please enter numbers only.")
