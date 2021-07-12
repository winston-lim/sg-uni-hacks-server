import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { User, UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "../mutations/createHack.test";
import { Category } from "../../../../types";

export const createHacks = async (user: User) => {
	await validCreateHackMutation(
		{
			title: "test 1",
			category: Category.GENERAL,
			description: "first test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	await validCreateHackMutation(
		{
			title: "test 2",
			category: Category.GENERAL,
			description: "second test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	await validCreateHackMutation(
		{
			title: "test 3",
			category: Category.GENERAL,
			description: "third test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	await validCreateHackMutation(
		{
			title: "test 4",
			category: Category.GENERAL,
			description: "fourth test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	await validCreateHackMutation(
		{
			title: "test 5",
			category: Category.GENERAL,
			description: "fifth test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
};

export const unverifiedHacksQuery = `
query UnverifiedHacks($limit: Int!, $cursor: String) {
  unverifiedHacks(limit: $limit, cursor: $cursor) {
    hacks{
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
    hasMore
  }
}
`;

export const validUnverifiedHacksQuery = async (
	limit: number,
	cursor?: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: unverifiedHacksQuery,
		variableValues: {
			limit,
			cursor,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validUnverifiedHacksQuery(5);
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validUnverifiedHacksQuery(5, undefined, {
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if user is not an admin", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validUnverifiedHacksQuery(5, undefined, {
		userId: user.id,
		role: user.role,
	});
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("not enough permissions");
	expect(errors![1]).not.toBeDefined();
});

it("returns paginated unverified hacks", async () => {
	const { user } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
		"password"
	);
	const { user: admin } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);
	await createHacks(user);

	const { data: unverifiedHacksData, errors } = await validUnverifiedHacksQuery(
		3,
		undefined,
		{
			userId: admin.id,
			role: admin.role,
		}
	);
	expect(errors).not.toBeDefined();
	const {
		unverifiedHacks: { hacks: paginatedHacks, hasMore },
	} = unverifiedHacksData!;
	expect(paginatedHacks.length).toEqual(3);
	expect(hasMore).toEqual(true);
});

it("returns paginated unverified hacks from cursor specified", async () => {
	const { user } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
		"password"
	);
	const { user: admin } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);
	await createHacks(user);

	const { data: unverifiedHacksData } = await validUnverifiedHacksQuery(
		3,
		undefined,
		{
			userId: admin.id,
			role: admin.role,
		}
	);
	const {
		unverifiedHacks: { hacks },
	} = unverifiedHacksData!;
	const cursor = hacks[2].createdAt;

	const { data, errors } = await validUnverifiedHacksQuery(2, cursor, {
		userId: admin.id,
		role: admin.role,
	});
	expect(errors).not.toBeDefined();
	const {
		unverifiedHacks: { hacks: paginatedHacks, hasMore },
	} = data!;
	expect(paginatedHacks.length).toEqual(2);
	expect(paginatedHacks[0].title).toEqual("test 2");
	expect(hasMore).toEqual(false);
});
