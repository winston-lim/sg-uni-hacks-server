import {
	Arg,
	Ctx,
	Field,
	FieldResolver,
	Int,
	Mutation,
	ObjectType,
	Query,
	Resolver,
	Root,
	UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Hack } from "../entities/Hack";
import { User, UserRole } from "../entities/User";
import { Vote } from "../entities/Vote";
import { isAdmin } from "../middleware/isAdmin";
import { isAuth } from "../middleware/isAuth";
import { CreateHackInput, MyContext, UpdateHackInput } from "../types";

@ObjectType()
class PaginatedHacks {
	@Field(() => [Hack])
	hacks: Hack[];

	@Field()
	hasMore: boolean;
}

@Resolver(Hack)
export class HackResolver {
	@FieldResolver(() => String)
	descriptionSnippet(@Root() root: Hack) {
		return root.description.slice(0, 50);
	}

	@FieldResolver(() => User)
	creator(@Root() hack: Hack, @Ctx() { userLoader }: MyContext) {
		return userLoader.load(hack.creatorId);
	}

	@FieldResolver(() => Int, { nullable: true })
	async voteStatus(@Root() hack: Hack, @Ctx() { voteLoader, req }: MyContext) {
		if (!req.session.userId) {
			return null;
		}
		const vote = await voteLoader.load({
			hackId: hack.id,
			userId: req.session.userId,
		});
		return vote ? vote.value : null;
	}

	@FieldResolver(() => Int)
	duration(@Root() hack: Hack) {
		const wordCount = hack.body.split(" ").length;
		const estimatedDuration = Math.ceil(wordCount / 200);
		return estimatedDuration;
	}

	@FieldResolver(() => String)
	hackUrl(@Root() hack: Hack) {
		if (!hack.verified) return null;
		return `${hack.id}`;
	}

	@UseMiddleware(isAuth)
	@UseMiddleware(isAdmin)
	@Query(() => [Hack!])
	async allHacks() {
		return Hack.find({ order: { verified: "DESC" } });
	}

	@Query(() => PaginatedHacks)
	async verifiedHacks(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedHacks> {
		const realLimit = Math.min(15, limit);
		const realLimitPlusOne = realLimit + 1;
		const replacements: any[] = [realLimitPlusOne];
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		const hacks = await getConnection().query(
			`
        select h.* from hack h
        ${
					cursor
						? `where h."updatedAt"< $2 and h.verified =  true`
						: "where h.verified = true"
				}
        order by h."updatedAt" DESC
        limit $1
      `,
			replacements
		);
		return {
			hacks: hacks.slice(0, realLimit),
			hasMore: hacks.length === realLimitPlusOne,
		};
	}

	@Query(() => PaginatedHacks)
	@UseMiddleware(isAuth)
	@UseMiddleware(isAdmin)
	async unverifiedHacks(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null
	): Promise<PaginatedHacks> {
		const realLimit = Math.min(15, limit);
		const realLimitPlusOne = realLimit + 1;
		const replacements: any[] = [realLimitPlusOne];
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		const hacks = await getConnection().query(
			`
        select h.* from hack h
        ${
					cursor
						? `where h."updatedAt"< $2 and h.verified = false`
						: "where h.verified = false"
				}
        order by h."updatedAt" DESC
        limit $1
      `,
			replacements
		);
		return {
			hacks: hacks.slice(0, realLimit),
			hasMore: hacks.length === realLimitPlusOne,
		};
	}

	@Query(() => [Hack])
	@UseMiddleware(isAuth)
	async userHacks(@Ctx() { req }: MyContext): Promise<Hack[]> {
		return Hack.find({
			where: {
				creatorId: req.session.userId,
			},
			order: {
				updatedAt: "DESC",
			},
		});
	}

	@Query(() => PaginatedHacks)
	async verifiedHacksByCategory(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null,
		@Arg("category") category: string
	): Promise<PaginatedHacks> {
		const realLimit = Math.min(15, limit);
		const realLimitPlusOne = realLimit + 1;
		const replacements: any[] = [realLimitPlusOne];
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		const hacks = await getConnection().query(
			`
        select h.* from hack h
        ${
					cursor
						? `where h."updatedAt"< $2 and h.verified = true`
						: "where h.verified = true"
				} and h.category =  '${category}'
        order by h."updatedAt" DESC
        limit $1
      `,
			replacements
		);
		return {
			hacks: hacks.slice(0, realLimit),
			hasMore: hacks.length === realLimitPlusOne,
		};
	}

	@Query(() => Hack, { nullable: true })
	async hack(@Arg("id") id: string): Promise<Hack | undefined> {
		return Hack.findOne(id);
	}

	@Query(() => PaginatedHacks)
	async verifiedHacksBySearchTerm(
		@Arg("limit", () => Int) limit: number,
		@Arg("cursor", () => String, { nullable: true }) cursor: string | null,
		@Arg("searchTerm") searchTerm: string
	): Promise<PaginatedHacks> {
		const realLimit = Math.min(15, limit);
		const realLimitPlusOne = realLimit + 1;
		const replacements: any[] = [realLimitPlusOne];
		if (cursor) {
			replacements.push(new Date(parseInt(cursor)));
		}
		const hacks = await getConnection().query(
			`
        select h.* from hack h
        ${
					cursor
						? `where h."updatedAt"< $2 and h.verified = true`
						: "where h.verified = true"
				}${
				searchTerm !== ""
					? ` and (h.title ILIKE '%${searchTerm}%' or h.description ILIKE '%${searchTerm}%')`
					: ""
			}
        order by h."updatedAt" DESC
        limit $1
      `,
			replacements
		);
		return {
			hacks: hacks.slice(0, realLimit),
			hasMore: hacks.length === realLimitPlusOne,
		};
	}

	@Mutation(() => Hack)
	@UseMiddleware(isAuth)
	async createHack(
		@Arg("input") input: CreateHackInput,
		@Ctx() { req }: MyContext
	): Promise<Hack | null> {
		const hack = await Hack.create({
			...input,
			verified: false,
			creatorId: req.session.userId!,
		}).save();
		hack.updatedAt = hack.createdAt;
		await hack.save();
		return hack;
	}

	@Mutation(() => Hack, { nullable: true })
	@UseMiddleware(isAuth)
	async updateHack(
		@Arg("id") id: string,
		@Arg("input") input: UpdateHackInput,
		@Ctx() { req }: MyContext
	): Promise<Hack | null> {
		const hack = await Hack.findOne(id);
		UserRole;
		if (!hack) return null;
		if (req.session.userId !== hack.creatorId && req.session.role !== "admin") {
			throw new Error("not enough permissions");
		}
		if (hack.updates) {
			return null;
		}
		hack.verified = false;
		hack.updates = JSON.stringify(input);
		return await hack.save({});
	}

	@Mutation(() => Hack, { nullable: true })
	@UseMiddleware(isAuth)
	@UseMiddleware(isAdmin)
	async verifyHack(@Arg("id") id: string): Promise<Hack | null> {
		const hack = await Hack.findOne(id);
		if (!hack) {
			return null;
		}
		hack.verified = true;
		try {
			return await hack.save();
		} catch (e) {
			console.log("error: ", e);
			return null;
		}
	}

	@Mutation(() => Hack, { nullable: true })
	@UseMiddleware(isAuth)
	@UseMiddleware(isAdmin)
	async verifyUpdate(@Arg("id") id: string): Promise<Hack | null> {
		const hack = await Hack.findOne(id);
		if (!hack) return null;
		if (!hack.updates) return null;
		const updates = JSON.parse(hack.updates);
		hack.updates = null;
		await hack.save();
		await Hack.update(id, { ...updates });
		const updatedHack = await Hack.findOne(id);
		updatedHack!.verified = true;
		updatedHack!.updatedAt = new Date();
		await updatedHack?.save();
		return updatedHack!;
	}

	@Mutation(() => Boolean, { nullable: true })
	@UseMiddleware(isAuth)
	async deleteHack(
		@Arg("id") id: string,
		@Ctx() { req }: MyContext
	): Promise<boolean> {
		//user!==creator of Hack
		const hack = await Hack.findOne(id);
		const user = await User.findOne(req.session.userId);
		if (!user || !hack) return false;
		if (hack.creatorId !== req.session.userId && user.role !== UserRole.ADMIN)
			return false;

		try {
			await getConnection()
				.createQueryBuilder()
				.delete()
				.from(Hack)
				.where("id= :id", { id })
				.andWhere("creatorId= :creatorId", {
					creatorId:
						user.role === UserRole.ADMIN ? hack.creatorId : req.session.userId,
				})
				.execute();
			return true;
		} catch (e) {
			console.log(e);
			return false;
		}
	}

	// @Mutation(() => Boolean)
	// @UseMiddleware(isAuth)
	// @UseMiddleware(isAdmin)
	// async deleteAllHacksOfUser(@Arg("userId") userId: string): Promise<boolean> {
	// 	try {
	// 		await Hack.delete({ creatorId: userId });
	// 		return true;
	// 	} catch (e) {
	// 		console.log(e);
	// 		return false;
	// 	}
	// }

	@Mutation(() => Boolean)
	@UseMiddleware(isAuth)
	async vote(
		@Arg("hackId") hackId: string,
		@Arg("value", () => Int) value: number,
		@Ctx() { req }: MyContext
	) {
		const isUpvote = value === 1;
		const voteValue = isUpvote ? 1 : 0;
		const { userId } = req.session;
		const hack = await Hack.findOne(hackId);
		if (!hack!.verified) {
			return false;
		}
		const vote = await Vote.findOne({ where: { hackId, userId } });
		if (vote && vote.value !== voteValue) {
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
				update vote
				set value = $1
				where "hackId" = $2
				and "userId" = $3
				`,
					[voteValue, hackId, userId]
				);
				await tm.query(
					`
				update hack
				set points = points + $1
				where "id" = $2
				`,
					[voteValue === 0 ? -1 : 1, hackId]
				);
			});
			return true;
		} else if (!vote) {
			await getConnection().transaction(async (tm) => {
				await tm.query(
					`
				insert into vote ("userId", "hackId", value)
				values ($1, $2, $3)
				`,
					[userId, hackId, voteValue]
				);
				await tm.query(
					`
				update hack
				set points = points + $1
				where id = $2
				`,
					[voteValue, hackId]
				);
			});
			return true;
		} else {
			return false;
		}
	}
}
