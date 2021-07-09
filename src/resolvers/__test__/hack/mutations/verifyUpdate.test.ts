import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "./createHack.test";
import { Category } from "../../../../types";
import { Hack } from "../../../../entities/Hack";
import { compareHackData } from "../../../../test/helper";
import { validUpdateHackMutation } from "./updateHack.test";

export const createHackMutation = `
mutation VerifyUpdate($id: String!) {
  verifyUpdate(id: $id) {
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

export const validVerifyUpdateMutation = async (
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
	const { data, errors } = await validVerifyUpdateMutation(uuidv4());
	expect(data!.verifyUpdate).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validVerifyUpdateMutation(uuidv4(), {
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data!.verifyUpdate).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if user is not an admin", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validVerifyUpdateMutation(uuidv4(), {
		userId: user.id,
		role: UserRole.REGULAR,
	});
	expect(data!.verifyUpdate).toBeNull();
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
	const { data, errors } = await validVerifyUpdateMutation(uuidv4(), {
		userId: admin,
		role: admin.role,
	});
	expect(data!.verifyUpdate).toBeNull();
	expect(errors).not.toBeDefined();
});

it("returns null if hack does not have any update", async () => {
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

	const { data, errors } = await validVerifyUpdateMutation(createdHack.id, {
		userId: admin,
		role: admin.role,
	});
	expect(data!.verifyUpdate).toBeNull();
	expect(errors).not.toBeDefined();
});

it("verifies and updates a hack", async () => {
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
	const { data: updateHackData } = await validUpdateHackMutation(
		createdHack.id,
		{
			title: "updated title",
			description: "updated description",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	const { updateHack: updatedHack } = updateHackData!;
	expect(compareHackData(createdHack, updatedHack)).toEqual(null);

	const { data: verifyUpdateData } = await validVerifyUpdateMutation(
		updatedHack.id,
		{
			userId: admin.id,
			role: admin.role,
		}
	);
	const { verifyUpdate: verifiedUpdateHack } = verifyUpdateData!;
	const { title, description, updates, verified, createdAt, updatedAt } =
		verifiedUpdateHack;
	expect(title).toEqual("updated title");
	expect(description).toEqual("updated description");
	expect(updates).toBeNull();
	expect(verified).toEqual(true);
	expect(createdAt).not.toEqual(updatedAt);
	expect(compareHackData(verifiedUpdateHack, createdHack)?.length).toEqual(3);

	const storedHack = await Hack.findOne(verifiedUpdateHack.id);
	expect(storedHack!.title).toEqual("updated title");
	expect(storedHack!.description).toEqual("updated description");
	expect(storedHack!.updates).toBeNull();
	expect(storedHack!.verified).toEqual(true);
	expect(storedHack!.createdAt).not.toEqual(updatedAt);
});
