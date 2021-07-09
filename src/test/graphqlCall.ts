import { graphql, GraphQLSchema } from "graphql";
import { buildSchema, Maybe } from "type-graphql";
import { HackResolver } from "../resolvers/hack";
import { UserResolver } from "../resolvers/user";
import { createContext } from "./context";

interface Options {
	source: string;
	variableValues?: Maybe<{
		[key: string]: any;
	}>;
	context: ReturnType<typeof createContext>;
}

let schema: GraphQLSchema;
export const graphqlCall = async ({
	source,
	variableValues,
	context,
}: Options) => {
	if (!schema) {
		schema = await buildSchema({
			resolvers: [UserResolver, HackResolver],
			validate: false,
		});
	}
	return graphql({
		schema,
		source,
		variableValues,
		contextValue: context,
	});
};
