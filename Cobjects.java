public class Cobjects{
	public static void main(String []args){
		Student student1 = new Student();
		student1.firstname = "Kyle";
		student1.Lastname = "Caleste";
		student1.gwa = "1.0";
		student1.year = "1st";
		student1.major = "Computer Science";

		Student student2 = new Student();
		student2.firstname = "Lucky";
		student2.Lastname = "Boy";
		student2.gwa = "3.0";
		student2.year = "2nd";
		student2.major = "Civil Engeering";

				System.out.println("FIRSTNAME1: "	+ student1.firstname);
				System.out.println("LALSTNAME1: "	+ student1.Lastname);
				System.out.println("GWA1: "	+ student1.gwa);
				System.out.println("YEAR1: "	+ student1.year);
				System.out.println("MAJOR1: "	+ student1.major);

				System.out.println("FIRSTNAME2: "	+ student2.firstname);
				System.out.println("LASTNAME2: "	+ student2.Lastname);
				System.out.println("GWA2: "	+ student2.gwa);
				System.out.println("YEAR2: "	+ student2.year);
				System.out.println("MAJOR2: "	+ student2.major);

}
}