import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "../mutations/createHack.test";
import { Category } from "../../../../types";

export const hackQuery = `
query Hack($id: String!) {
  hack(id: $id){
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

export const validHackQuery = async (
	id: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: hackQuery,
		variableValues: {
			id,
		},
		context,
	});
	return { data, context, errors };
};

it("returns null if hack does not exist", async () => {
	const { data, errors } = await validHackQuery(uuidv4());
	expect(errors).toBeUndefined();
	expect(data!.hack).toBeNull();
});

it("returns null if hack does not exist", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data: createHackData } = await validCreateHackMutation(
		{
			title: "test",
			category: Category.GENERAL,
			description: "this is a test",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	const { createHack: createdHack } = createHackData!;
	const { data, errors } = await validHackQuery(createdHack.id);
	expect(errors).toBeUndefined();
	expect(data!.hack.title).toEqual("test");
	expect(data!.hack.description).toEqual("this is a test");
});
