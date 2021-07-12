import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { createHacks } from "./unverifiedHacks.test";

export const userHacksQuery = `
query UserHacks {
  userHacks{
    id
    title
    category
    description
    body
    updates
    points
    voteStatus
    verified
    creator {
      id
      username
      email
    }
    createdAt
    updatedAt
  }
}
`;

export const validUserHacksQuery = async (contextOptions?: ContextOptions) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: userHacksQuery,
		variableValues: {},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validUserHacksQuery();
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validUserHacksQuery({
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("returns user's hacks", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validUserHacksQuery({
		userId: user.id,
		role: user.role,
	});
	expect(errors).not.toBeDefined();
	expect(data!.userHacks).toEqual([]);
	await createHacks(user);
	const { data: updatedData, errors: updatedErrors } =
		await validUserHacksQuery({
			userId: user.id,
			role: user.role,
		});
	expect(updatedErrors).toBeUndefined();
	const { userHacks } = updatedData!;
	expect(userHacks.length).toEqual(5);
	expect(userHacks[0].title).toEqual("test 5");
});
