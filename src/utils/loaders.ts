import DataLoader from "dataloader";
import { User } from "../entities/User";
import { Vote } from "../entities/Vote";

export const createUserLoader = () => {
	return new DataLoader<string, User>(async (userIds) => {
		const users = await User.findByIds(userIds as string[]);
		const userIdToUser: Record<number, User> = {};
		users.forEach((u) => {
			userIdToUser[u.id] = u;
		});
		return userIds.map((userId) => userIdToUser[userId]);
	});
};

export const createVoteLoader = () => {
	return new DataLoader<{ hackId: string; userId: string }, Vote | null>(
		async (keys) => {
			const votes = await Vote.findByIds(keys as any);
			const voteIdsToVote: Record<string, Vote | null> = {};
			votes.forEach((vote) => {
				voteIdsToVote[`${vote.userId}|${vote.hackId}`] = vote;
			});
			return keys.map((key) => voteIdsToVote[`${key.userId}|${key.hackId}`]);
		}
	);
};
