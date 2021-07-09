import { IsEmail, MinLength } from "class-validator";
import { Field, ObjectType } from "type-graphql";
import {
	BaseEntity,
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	//OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from "typeorm";
import { Hack } from "./Hack";
import { Vote } from "./Vote";

export enum UserRole {
	REGULAR = "regular",
	ADMIN = "admin",
}

@ObjectType()
@Entity()
export class User extends BaseEntity {
	@Field(() => String)
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Field()
	@Column({ unique: true })
	@MinLength(6, {
		message: "username must be at least 6 characters long",
	})
	username!: string;

	@Field()
	@Column({ unique: true })
	@IsEmail(
		{},
		{
			message: "enter a valid email",
		}
	)
	email!: string;

	@Column()
	@MinLength(6, {
		message: "password must be at least 6 characters long",
	})
	password!: string;

	@Field()
	@Column({
		type: "enum",
		enum: UserRole,
	})
	role!: UserRole;

	@Field(() => String, { nullable: true })
	@Column({ type: "text", nullable: true })
	changePasswordToken: string | null;

	@OneToMany(() => Hack, (hack) => hack.creator)
	hacks: Hack[];

	@OneToMany(() => Vote, (vote) => vote.user)
	votes: Vote[];

	@Field(() => String)
	@CreateDateColumn()
	createdAt: Date;

	@Field(() => String)
	@UpdateDateColumn()
	updatedAt: Date;
}
