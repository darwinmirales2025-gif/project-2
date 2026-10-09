import java.util.Scanner;

	public class DigitConvert{
		public static void main(String []args){
			Scanner input = new Scanner(System.in);

			System.out.println("1. Convert digit to character");
			System.out.println("2. Convert character to digit ");
			int choice = input.nextInt();

			if(choice == 1){
				System.out.print("Enter a Digit: ");
				int digit = input.nextInt();
				char c1 = (char) (digit + 55);
				System.out.println("Convert digit to character: " + c1);
		}

		else if(choice == 2){
			System.out.print("Enter a character: ");
			String character = input.next();

			char c = character.charAt(0);
			int digit = c - 55;
			System.out.println("Convert character to digit: " + digit);
		}
	}
}
