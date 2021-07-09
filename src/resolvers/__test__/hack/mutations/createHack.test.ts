import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { Category, CreateHackInput } from "../../../../types";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";

export const createHackMutation = `
mutation CreateHack($input: CreateHackInput!) {
  createHack(input: $input) {
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

export const validCreateHackMutation = async (
	input: CreateHackInput,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: createHackMutation,
		variableValues: {
			input,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validCreateHackMutation({
		title: "test",
		category: Category.GENERAL,
		description: "basic description",
		body: "empty",
	});
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validCreateHackMutation(
		{
			title: "test",
			category: Category.GENERAL,
			description: "basic description",
			body: "empty",
		},
		{
			userId: uuidv4(),
			role: UserRole.REGULAR,
		}
	);
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("creates a hack", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validCreateHackMutation(
		{
			title: "test",
			category: Category.GENERAL,
			description: "basic description",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	expect(errors).not.toBeDefined();
	const {
		createHack: {
			title,
			category,
			description,
			body,
			updates,
			points,
			voteStatus,
			verified,
			creator,
			createdAt,
			updatedAt,
		},
	} = data!;
	expect(title).toEqual("test");
	expect(category).toEqual(Category.GENERAL);
	expect(description).toEqual("basic description");
	expect(body).toEqual("empty");
	expect(updates).toBeNull();
	expect(points).toEqual(0);
	expect(voteStatus).toBeNull();
	expect(verified).toEqual(false);
	expect(creator.id).toEqual(user.id);
	expect(createdAt).toEqual(updatedAt);
});
