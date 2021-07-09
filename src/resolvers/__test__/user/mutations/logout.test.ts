import { User } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { loginMutation } from "./login.test";
import { validRegisterMutation } from "./register.test";

const logoutMutation = `
mutation {
  logout
}
`;

it("returns logs a signed in user out", async () => {
	const context = createContext({});
	await validRegisterMutation("tester", "tester@test.com", "password");
	const { data } = await graphqlCall({
		source: loginMutation,
		variableValues: {
			usernameOrEmail: "tester",
			password: "password",
		},
		context: context,
	});
	const { user, errors } = data!.login;
	expect(errors).toBeNull();
	expect(user).toMatchObject({
		username: "tester",
		email: "tester@test.com",
		role: "regular",
	});

	const createdUser = await User.findOne({ where: { username: "tester" } });
	expect(createdUser).toBeDefined();

	const { userId, role } = context.req.session;
	expect(userId).toEqual(createdUser!.id);
	expect(role).toEqual(createdUser!.role);

	const { data: logoutData } = await graphqlCall({
		source: logoutMutation,
		variableValues: {
			usernameOrEmail: "tester",
			password: "password",
		},
		context: context,
	});
	const { logout: status } = logoutData!;
	expect(status).toEqual(true);

	expect(context.req.session.destroy).toHaveBeenCalled();
	expect(context.res.clearCookie).toHaveBeenCalled();
});
