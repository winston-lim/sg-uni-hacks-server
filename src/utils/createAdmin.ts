import { getConnection } from "typeorm";
import { User, UserRole } from "../entities/User";
import argon2 from "argon2";

export const createAdmin = async () => {
	const hashedPassword = await argon2.hash(
		process.env.ADMIN_PASSWORD || "default"
	);
	const admin = await User.findOne({
		where: {
			username: "admin1",
		},
	});
	if (admin) {
		return console.log("ADMIN CREATED");
	}
	try {
		await getConnection()
			.createQueryBuilder()
			.insert()
			.into(User)
			.values({
				username: "admin1",
				email: "winston_lim1@hotmail.com",
				password: hashedPassword,
				role: UserRole.ADMIN,
			})
			.returning("*")
			.execute();
		console.log("CREATED ADMIN");
	} catch (e) {
		console.log("Error creating admin: MESSAGE= ", e.message);
	}
};

export default createAdmin;
