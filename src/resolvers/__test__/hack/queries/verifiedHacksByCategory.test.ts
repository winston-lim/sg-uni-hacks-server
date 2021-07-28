import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { createAndVerifyHacks } from "./verifiedHacks.test";

export const verifiedHacksByCategoryQuery = `
query verifiedHacksByCategory($limit: Int!, $cursor: String, $category: String!) {
  verifiedHacksByCategory(limit: $limit, cursor: $cursor, category: $category) {
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

export const validVerifiedHacksByCategoryQuery = async (
	limit: number,
	category: string,
	cursor?: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: verifiedHacksByCategoryQuery,
		variableValues: {
			limit,
			cursor,
			category,
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
	const { data: verifiedHacksData, errors } =
		await validVerifiedHacksByCategoryQuery(3, "general");
	expect(errors).not.toBeDefined();
	const {
		verifiedHacksByCategory: { hacks: paginatedHacks, hasMore },
	} = verifiedHacksData!;
	expect(paginatedHacks.length).toEqual(3);
	expect(hasMore).toEqual(true);
	expect(paginatedHacks[0].title).toEqual("test 5");
});

it("returns paginated hacks from cursor", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);

	await createAndVerifyHacks(user);

	//returns latest hack first
	const { data } = await validVerifiedHacksByCategoryQuery(3, "general");
	const {
		verifiedHacksByCategory: { hacks },
	} = data!;
	const cursor = hacks[2].updatedAt;
	const { data: verifiedHacksData, errors } =
		await validVerifiedHacksByCategoryQuery(2, "general", cursor);
	expect(errors).not.toBeDefined();
	const {
		verifiedHacksByCategory: { hacks: paginatedHacks, hasMore },
	} = verifiedHacksData!;
	expect(paginatedHacks.length).toEqual(2);
	expect(paginatedHacks[0].title).toEqual("test 2");
	expect(hasMore).toEqual(false);
});
