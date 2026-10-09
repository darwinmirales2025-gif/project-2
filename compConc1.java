import java.util.Scanner;

	public class compConc1 {
	 	public static void main(String []args){
			Scanner input = new Scanner(System.in);

			System.out.print("String1:");
			String str1 = input.nextLine();

			System.out.print("String1:");
			String str2 = input.nextLine();

			if(str1.equals(str2)){
				System.out.println("String are Equal");
			}else{
				System.out.println("String are not Equal");
			}

			String concatenatedString = str1 + "" + str2;
			System.out.println("Concatenate: " + concatenatedString);

			input.close();
	}
}