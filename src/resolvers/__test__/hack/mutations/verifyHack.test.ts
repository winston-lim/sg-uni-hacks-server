import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "./createHack.test";
import { Category } from "../../../../types";
import { Hack } from "../../../../entities/Hack";
import { compareHackData } from "../../../../test/helper";

export const createHackMutation = `
mutation VerifyHack($id: String!) {
  verifyHack(id: $id) {
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

export const validVerifyHackMutation = async (
	id: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: createHackMutation,
		variableValues: {
			id,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validVerifyHackMutation(uuidv4());
	expect(data!.verifyHack).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validVerifyHackMutation(uuidv4(), {
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data!.verifyHack).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if user is not an admin", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validVerifyHackMutation(uuidv4(), {
		userId: user.id,
		role: UserRole.REGULAR,
	});
	expect(data!.verifyHack).toBeNull();
	expect(errors![0].message).toEqual("not enough permissions");
	expect(errors![1]).not.toBeDefined();
});

it("returns null if hack does not exist", async () => {
	const { user: admin } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);
	const { data, errors } = await validVerifyHackMutation(uuidv4(), {
		userId: admin.id,
		role: admin.role,
	});
	expect(errors).not.toBeDefined();
	expect(data!.verifyHack).toEqual(null);
});

it("verifies a hack", async () => {
	const { user: admin } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);
	const { user } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
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
	const { data, errors } = await validVerifyHackMutation(createdHack.id, {
		userId: admin.id,
		role: admin.role,
	});
	expect(errors).not.toBeDefined();
	const { verifyHack } = data!;
	const { id, verified, createdAt, updatedAt } = verifyHack;
	expect(verified).toEqual(true);
	expect(createdAt).toEqual(updatedAt);

	const verifiedHack = await Hack.findOne(id);
	expect(verifiedHack!.verified).toEqual(true);
	expect(verifiedHack!.createdAt).toEqual(verifiedHack!.updatedAt);

	const hackDifferences = compareHackData(createdHack, verifyHack);
	expect(hackDifferences).toEqual(null);
});
