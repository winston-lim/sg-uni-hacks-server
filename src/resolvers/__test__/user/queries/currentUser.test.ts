import { UserRole } from "../../../../entities/User";
import { createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { validRegisterMutation } from "../mutations/register.test";

export const currentUserQuery = `
  query {
    currentUser {
      id
      username
      email
      role
    }
  }
  `;

export const validCurrentUserQuery = async (
	userId?: string,
	role?: UserRole
) => {
	const context = createContext({ userId, role });
	const { data } = await graphqlCall({
		source: currentUserQuery,
		context,
	});
	const { currentUser } = data!;
	return { currentUser, context };
};

it("returns null if user has not logged in", async () => {
	const { currentUser } = await validCurrentUserQuery();
	expect(currentUser).toEqual(null);
});

it("returns user if user exists and is logged in", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { currentUser } = await validCurrentUserQuery(user.id, user.role);
	expect(currentUser.id).toEqual(user.id);
	expect(currentUser.username).toEqual(user.username);
	expect(currentUser.email).toEqual(user.email);
	expect(currentUser.role).toEqual(user.role);
});
