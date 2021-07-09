import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { Category, UpdateHackInput } from "../../../../types";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "./createHack.test";
import { Hack } from "../../../../entities/Hack";

export const updateHackMutation = `
mutation UpdateHack($id: String!, $input: UpdateHackInput!) {
  updateHack(id: $id, input: $input) {
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

export const validUpdateHackMutation = async (
	hackId: string,
	input: UpdateHackInput,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: updateHackMutation,
		variableValues: {
			id: hackId,
			input,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validUpdateHackMutation(uuidv4(), {
		title: "updated test",
		category: Category.GENERAL,
		description: "updated description",
		body: "empty",
	});
	expect(data!.updateHack).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validUpdateHackMutation(
		uuidv4(),
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
	expect(data!.updateHack).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("returns null if hack does not exist", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data, errors } = await validUpdateHackMutation(
		uuidv4(),
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
	expect(data!.updateHack).toBeNull();
	expect(errors).not.toBeDefined();
});

it("throws an error if user is not creator", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
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
			description: "basic description",
			body: "empty",
		},
		{
			userId: user2.id,
			role: user2.role,
		}
	);
	const { id: hackId } = createHackData!.createHack;
	const { data, errors } = await validUpdateHackMutation(
		hackId,
		{
			title: "updated test",
			category: Category.GENERAL,
			description: "updated description",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	expect(data!.updateHack).toBeNull();
	expect(errors![0].message).toEqual("not enough permissions");
	expect(errors![1]).not.toBeDefined();
});

it("stores updates in json to hack.updates", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data: createHackData } = await validCreateHackMutation(
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
	const { id: hackId } = createHackData!.createHack;
	const { data, errors } = await validUpdateHackMutation(
		hackId,
		{
			title: "updated test",
			category: Category.GENERAL,
			description: "updated description",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	expect(errors).not.toBeDefined();
	const {
		updateHack: {
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
	expect(updates).not.toBeNull();
	expect(points).toEqual(0);
	expect(voteStatus).toBeNull();
	expect(verified).toEqual(false);
	expect(creator.id).toEqual(user.id);
	expect(createdAt).toEqual(updatedAt);
	const appliedUpdates = JSON.parse(updates);
	const {
		title: updatedTitle,
		description: updatedDescription,
		category: updatedCategory,
		body: updatedBody,
	} = appliedUpdates;
	expect(updatedTitle).toEqual("updated test");
	expect(updatedDescription).toEqual("updated description");
	expect(updatedCategory).toEqual(category);
	expect(updatedBody).toEqual(body);

	const hack = await Hack.findOne(hackId);
	expect(hack!.updates).not.toBeNull();
});

it("returns null if an update is being reviewed", async () => {
	const { user } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password"
	);
	const { data: createHackData } = await validCreateHackMutation(
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
	const { id: hackId } = createHackData!.createHack;
	await validUpdateHackMutation(
		hackId,
		{
			title: "updated test",
			category: Category.GENERAL,
			description: "updated description",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);

	const { data, errors } = await validUpdateHackMutation(
		hackId,
		{
			title: "failed update",
			category: Category.GENERAL,
			description: "updated description",
			body: "empty",
		},
		{
			userId: user.id,
			role: user.role,
		}
	);
	expect(errors).not.toBeDefined();
	expect(data!.updateHack).toBeNull();

	const hack = await Hack.findOne(hackId);
	const currentUpdates = JSON.parse(hack!.updates!);
	expect(currentUpdates.title).not.toEqual("failed update");
});
