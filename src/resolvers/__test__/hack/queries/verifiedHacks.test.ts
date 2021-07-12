import { User } from "../../../../entities/User";
import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { Category } from "../../../../types";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "../mutations/createHack.test";
import { validVerifyHackMutation } from "../mutations/verifyHack.test";

export const createAndVerifyHacks = async (user: User) => {
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
	).then(async ({ data }) => {
		const { createHack: createdHack } = data!;
		await validVerifyHackMutation(createdHack.id, {
			userId: user.id,
			role: user.role,
		});
	});
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
	).then(async ({ data }) => {
		const { createHack: createdHack } = data!;
		await validVerifyHackMutation(createdHack.id, {
			userId: user.id,
			role: user.role,
		});
	});
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
	).then(async ({ data }) => {
		const { createHack: createdHack } = data!;
		await validVerifyHackMutation(createdHack.id, {
			userId: user.id,
			role: user.role,
		});
	});
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
	).then(async ({ data }) => {
		const { createHack: createdHack } = data!;
		await validVerifyHackMutation(createdHack.id, {
			userId: user.id,
			role: user.role,
		});
	});
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
	).then(async ({ data }) => {
		const { createHack: createdHack } = data!;
		await validVerifyHackMutation(createdHack.id, {
			userId: user.id,
			role: user.role,
		});
	});
};

export const verifiedHacksQuery = `
query VerifiedHacks($limit: Int!, $cursor: String) {
  verifiedHacks(limit: $limit, cursor: $cursor) {
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

export const validVerifiedHacksQuery = async (
	limit: number,
	cursor?: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: verifiedHacksQuery,
		variableValues: {
			limit,
			cursor,
		},
		context,
	});
	return { data, context, errors };
};

it("returns paginated hacks", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);

	await createAndVerifyHacks(user);

	//returns latest hack first
	const { data: verifiedHacksData, errors } = await validVerifiedHacksQuery(3);
	expect(errors).not.toBeDefined();
	const {
		verifiedHacks: { hacks: paginatedHacks, hasMore },
	} = verifiedHacksData!;
	expect(paginatedHacks.length).toEqual(3);
	expect(hasMore).toEqual(true);
	expect(paginatedHacks[0].title).toEqual("test 5");
});

it("returns paginated hacks with from cursor", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);

	await createAndVerifyHacks(user);

	//returns latest hack first
	const { data } = await validVerifiedHacksQuery(3);
	const {
		verifiedHacks: { hacks },
	} = data!;
	const cursor = hacks[2].updatedAt;
	const { data: verifiedHacksData, errors } = await validVerifiedHacksQuery(
		2,
		cursor
	);
	expect(errors).not.toBeDefined();
	const {
		verifiedHacks: { hacks: paginatedHacks, hasMore },
	} = verifiedHacksData!;
	expect(paginatedHacks.length).toEqual(2);
	expect(paginatedHacks[0].title).toEqual("test 2");
	expect(hasMore).toEqual(false);
});
