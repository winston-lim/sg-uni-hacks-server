import { ContextOptions, createContext } from "../../../../test/context";
import { graphqlCall } from "../../../../test/graphqlCall";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../../../entities/User";
import { validRegisterMutation } from "../../user/mutations/register.test";
import { validCreateHackMutation } from "./createHack.test";
import { Category } from "../../../../types";
//import { Vote } from "../../../../entities/Vote";
import { Hack } from "../../../../entities/Hack";
import { validVerifyHackMutation } from "./verifyHack.test";

export const voteMutation = `
mutation vote($hackId: String!, $value: Int!) {
  vote(hackId: $hackId, value: $value)
}
`;

export const validVoteMutation = async (
	hackId: string,
	value: number,
	contextOptions?: ContextOptions
) => {
	const context = createContext({ ...contextOptions });
	const { data, errors } = await graphqlCall({
		source: voteMutation,
		variableValues: {
			hackId,
			value,
		},
		context,
	});
	return { data, context, errors };
};

it("throws an errors if unauthenticated", async () => {
	const { data, errors } = await validVoteMutation(uuidv4(), 1);
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("not authenticated");
	expect(errors![1]).not.toBeDefined();
});

it("throws an error if authenticated user no longer exists", async () => {
	const { data, errors } = await validVoteMutation(uuidv4(), 1, {
		userId: uuidv4(),
		role: UserRole.REGULAR,
	});
	expect(data).toBeNull();
	expect(errors![0].message).toEqual("user no longer exists");
	expect(errors![1]).not.toBeDefined();
});

it("returns false if hack is not verified", async () => {
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
	const { data, errors } = await validVoteMutation(createdHack.id, 1, {
		userId: user.id,
		role: user.role,
	});
	expect(errors).not.toBeDefined();
	expect(data!.vote).toEqual(false);
});

// it("creates a vote for a hack if it does not exist", async () => {
// 	const { user: admin } = await validRegisterMutation(
// 		"tester",
// 		"tester@test.com",
// 		"password",
// 		true
// 	);
// 	const { user } = await validRegisterMutation(
// 		"tester1",
// 		"tester1@test.com",
// 		"password"
// 	);

// 	const { data: createHackData } = await validCreateHackMutation(
// 		{
// 			title: "test",
// 			category: Category.GENERAL,
// 			description: "this is a test",
// 			body: "empty",
// 		},
// 		{
// 			userId: user.id,
// 			role: user.role,
// 		}
// 	);
// 	const { createHack: createdHack } = createHackData!;
// 	await validVerifyHackMutation(createdHack.id, {
// 		userId: admin.id,
// 		role: admin.role,
// 	});
// 	const { data, errors } = await validVoteMutation(createdHack.id, 1, {
// 		userId: user.id,
// 		role: user.role,
// 	});
// 	expect(errors).not.toBeDefined();
// 	expect(data!.vote).toEqual(true);

// 	const vote = await Vote.findOne({ where: { hackId: createdHack.id } });
// 	expect(vote).toBeDefined();
// 	expect(vote?.userId).toEqual(user.id);

// 	const hack = await Hack.findOne(createdHack.id);
// 	expect(hack?.points).toEqual(1);
// });

// it("returns false if a vote of the same value already exists", async () => {
// 	const { user: admin } = await validRegisterMutation(
// 		"tester",
// 		"tester@test.com",
// 		"password",
// 		true
// 	);
// 	const { user } = await validRegisterMutation(
// 		"tester1",
// 		"tester1@test.com",
// 		"password"
// 	);
// 	const { data: createHackData } = await validCreateHackMutation(
// 		{
// 			title: "test",
// 			category: Category.GENERAL,
// 			description: "this is a test",
// 			body: "empty",
// 		},
// 		{
// 			userId: user.id,
// 			role: user.role,
// 		}
// 	);
// 	const { createHack: createdHack } = createHackData!;
// 	await validVerifyHackMutation(createdHack.id, {
// 		userId: admin.id,
// 		role: admin.role,
// 	});

// 	await validVoteMutation(createdHack.id, 1, {
// 		userId: user.id,
// 		role: user.role,
// 	});

// 	const { data, errors } = await validVoteMutation(createdHack.id, 1, {
// 		userId: user.id,
// 		role: user.role,
// 	});
// 	expect(errors).not.toBeDefined();
// 	expect(data!.vote).toEqual(false);

// 	const hack = await Hack.findOne(createdHack.id);
// 	expect(hack!.points).toEqual(1);
// });

// it("changes the vote and hack points if a different value is given", async () => {
// 	const { user: admin } = await validRegisterMutation(
// 		"tester",
// 		"tester@test.com",
// 		"password",
// 		true
// 	);
// 	const { user } = await validRegisterMutation(
// 		"tester1",
// 		"tester1@test.com",
// 		"password"
// 	);
// 	const { data: createHackData } = await validCreateHackMutation(
// 		{
// 			title: "test",
// 			category: Category.GENERAL,
// 			description: "this is a test",
// 			body: "empty",
// 		},
// 		{
// 			userId: user.id,
// 			role: user.role,
// 		}
// 	);
// 	const { createHack: createdHack } = createHackData!;
// 	await validVerifyHackMutation(createdHack.id, {
// 		userId: admin.id,
// 		role: admin.role,
// 	});

// 	await validVoteMutation(createdHack.id, 1, {
// 		userId: user.id,
// 		role: user.role,
// 	});
// 	const upvotedHack = await Hack.findOne(createdHack.id);
// 	expect(upvotedHack!.points).toEqual(1);

// 	const { data, errors } = await validVoteMutation(createdHack.id, -1, {
// 		userId: user.id,
// 		role: user.role,
// 	});
// 	expect(errors).not.toBeDefined();
// 	expect(data!.vote).toEqual(true);
// 	const downvotedHack = await Hack.findOne(createdHack.id);
// 	expect(downvotedHack!.points).toEqual(-1);
// });

it("updates points correctly with multiple votes casted by different users", async () => {
	const { user: admin } = await validRegisterMutation(
		"tester",
		"tester@test.com",
		"password",
		true
	);
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
			userId: user1.id,
			role: user1.role,
		}
	);
	const { createHack: createdHack } = createHackData!;
	await validVerifyHackMutation(createdHack.id, {
		userId: admin.id,
		role: admin.role,
	});
	await validVoteMutation(createdHack.id, 1, {
		userId: user1.id,
		role: user1.role,
	});
	const firstHack = await Hack.findOne(createdHack.id);
	expect(firstHack!.points).toEqual(1);

	await validVoteMutation(createdHack.id, 1, {
		userId: user2.id,
		role: user2.role,
	});
	const secondHack = await Hack.findOne(createdHack.id);
	expect(secondHack!.points).toEqual(2);

	await validVoteMutation(createdHack.id, 0, {
		userId: user1.id,
		role: user1.role,
	});
	const thirdHack = await Hack.findOne(createdHack.id);
	expect(thirdHack!.points).toEqual(1);

	await validVoteMutation(createdHack.id, 0, {
		userId: user2.id,
		role: user2.role,
	});
	const fourthHack = await Hack.findOne(createdHack.id);
	expect(fourthHack!.points).toEqual(0);
});
