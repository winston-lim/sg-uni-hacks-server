import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "./createHack.test";
import { Category } from "../../../../types";
import { Hack } from "../../../../entities/Hack";

export const deleteHackMutation = `
mutation DeleteHack($id: String!) {
  deleteHack(id: $id)
}
`;

export const validDeleteHackMutation = async (
	id: string,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: deleteHackMutation,
		variableValues: {
			id,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validDeleteHackMutation(uuidv4());
	expect(data!.deleteHack).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validDeleteHackMutation(uuidv4(), {
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data!.deleteHack).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("returns false if user is not creator and not an admin", async () => {
	const { user: user1 } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
		"password"
	);
	const { user: user2 } = await validRegisterMutation(
		"tester2",
		"tester2@test.com",
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
			userId: user2.id,
			role: user2.role,
		}
	);
	const { createHack: createdHack } = createHackData!;

	const { data: deleteHackData, errors } = await validDeleteHackMutation(
		createdHack.id,
		{
			userId: user1.id,
			role: user1.role,
		}
	);
	const { deleteHack } = deleteHackData!;
	expect(errors).not.toBeDefined();
	expect(deleteHack).toEqual(false);
});

it("deletes a hack if user is creator", async () => {
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

	const { data: deleteHackData, errors } = await validDeleteHackMutation(
		createdHack.id,
		{
			userId: user.id,
			role: user.role,
		}
	);
	const { deleteHack } = deleteHackData!;
	expect(errors).not.toBeDefined();
	expect(deleteHack).toEqual(true);

	const hack = await Hack.findOne(createdHack.id);
	expect(hack).not.toBeDefined();
});

it("deletes a hack if user is admin", async () => {
	const { user: admin } = await validRegisterMutation(
		"tester1",
		"tester1@test.com",
		"password",
		true
	);
	const { user: user2 } = await validRegisterMutation(
		"tester2",
		"tester2@test.com",
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
			userId: user2.id,
			role: user2.role,
		}
	);
	const { createHack: createdHack } = createHackData!;

	const { data: deleteHackData, errors } = await validDeleteHackMutation(
		createdHack.id,
		{
			userId: admin.id,
			role: admin.role,
		}
	);
	const { deleteHack } = deleteHackData!;
	expect(errors).not.toBeDefined();
	expect(deleteHack).toEqual(true);

	const hack = await Hack.findOne(createdHack.id);
	expect(hack).not.toBeDefined();
});
