import { Field, Int, ObjectType } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from "typeorm";
import { Category } from "../types";
import { User } from "./User";
import { Vote } from "./Vote";

@ObjectType()
@Entity()
export class Hack extends BaseEntity {
	@Field(() => String)
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Field()
	@Column()
	title!: string;

	@Field()
	@Column({
		type: "enum",
		enum: Category,
	})
	category!: Category;

	@Field()
	@Column()
	description!: string;

	@Field()
	@Column()
	body: string;

	@Field(() => String, { nullable: true })
	@Column("text", { nullable: true })
	updates: string | null;

	@Field(() => String, { nullable: true })
	@Column("text", { nullable: true })
	s3Url: string | null;

	@Field(() => Int)
	@Column({ type: "int", default: 0 })
	points!: number;

	@Field(() => Int, { nullable: true })
	voteStatus: number | null;

	@Field(() => Boolean)
	@Column()
	verified: boolean;

	@Field()
	@Column("uuid")
	creatorId: string;

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.hacks)
	creator: User;

	@OneToMany(() => Vote, (vote) => vote.hack)
	votes: Vote[];

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@Column({ nullable: true })
	updatedAt: Date;
}
