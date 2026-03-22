import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  user_id: string;
  email: string;
  password: string;
  role?: "admin" | "student" | "sponsor";
  status?: "active" | "suspended" | "deactivated";
  has_selected_role?: boolean;
  profile_url?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "user_id"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public user_id!: string;
  public email!: string;
  public password!: string;
  public role?: "admin" | "student" | "sponsor";
  public status!: "active" | "suspended" | "deactivated";
  public has_selected_role?: boolean;
  public profile_url?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    User.hasOne(models.Sponsor, {
      foreignKey: "user_id",
      as: "sponsor",
    });
    User.hasOne(models.Student, {
      foreignKey: "user_id",
      as: "student",
    });
  }
}

User.init(
  {
    user_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true, 
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("admin", "student", "sponsor"),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "suspended", "deactivated"),
      allowNull: false,
      defaultValue: "active",
    },
    has_selected_role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    profile_url: {
      type: DataTypes.STRING(1000),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
  }
);

export default User;