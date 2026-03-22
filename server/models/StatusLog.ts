import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface StatusLogAttributes {
  log_id: string;
  user_id: string;
  previous_status: "active" | "suspended" | "deactivated";
  new_status: "active" | "suspended" | "deactivated";
  changed_by: string;
  created_at?: Date;
}

interface StatusLogCreationAttributes extends Optional<StatusLogAttributes, "log_id"> {}

class StatusLog
  extends Model<StatusLogAttributes, StatusLogCreationAttributes>
  implements StatusLogAttributes
{
  public log_id!: string;
  public user_id!: string;
  public previous_status!: "active" | "suspended" | "deactivated";
  public new_status!: "active" | "suspended" | "deactivated";
  public changed_by!: string;
  public readonly created_at!: Date;

  static associate(models: any) {
    StatusLog.belongsTo(models.User, { foreignKey: "user_id", as: "user" });
    StatusLog.belongsTo(models.User, { foreignKey: "changed_by", as: "admin" });
  }
}

StatusLog.init(
  {
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    previous_status: {
      type: DataTypes.ENUM("active", "suspended", "deactivated"),
      allowNull: false,
    },
    new_status: {
      type: DataTypes.ENUM("active", "suspended", "deactivated"),
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "StatusLog",
    tableName: "status_logs",
    timestamps: false,
  }
);

export default StatusLog;
