import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface PasswordResetTokenAttributes {
  email: string;
  otp_hash: string;
  expires_at: Date;
  verified: boolean;
}

type PasswordResetTokenCreationAttributes = Optional<PasswordResetTokenAttributes, "verified">;

class PasswordResetToken
  extends Model<PasswordResetTokenAttributes, PasswordResetTokenCreationAttributes>
  implements PasswordResetTokenAttributes
{
  public email!: string;
  public otp_hash!: string;
  public expires_at!: Date;
  public verified!: boolean;
}

PasswordResetToken.init(
  {
    email: {
      type: DataTypes.STRING(254),
      primaryKey: true,
      allowNull: false,
    },
    otp_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "PasswordResetToken",
    tableName: "password_reset_tokens",
    timestamps: false,
  }
);

export default PasswordResetToken;
