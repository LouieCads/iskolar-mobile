import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

type ScholarshipStatus = "draft" | "active" | "closed" | "suspended" | "archived";

interface ScholarshipStatusLogAttributes {
  log_id: string;
  scholarship_id: string;
  previous_status: ScholarshipStatus;
  new_status: ScholarshipStatus;
  changed_by: string;
  created_at?: Date;
}

interface ScholarshipStatusLogCreationAttributes
  extends Optional<ScholarshipStatusLogAttributes, "log_id"> {}

class ScholarshipStatusLog
  extends Model<ScholarshipStatusLogAttributes, ScholarshipStatusLogCreationAttributes>
  implements ScholarshipStatusLogAttributes
{
  public log_id!: string;
  public scholarship_id!: string;
  public previous_status!: ScholarshipStatus;
  public new_status!: ScholarshipStatus;
  public changed_by!: string;
  public readonly created_at!: Date;

  static associate(models: any) {
    ScholarshipStatusLog.belongsTo(models.Scholarship, {
      foreignKey: "scholarship_id",
      as: "scholarship",
    });
    ScholarshipStatusLog.belongsTo(models.User, {
      foreignKey: "changed_by",
      as: "admin",
    });
  }
}

ScholarshipStatusLog.init(
  {
    log_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    scholarship_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    previous_status: {
      type: DataTypes.ENUM("draft", "active", "closed", "suspended", "archived"),
      allowNull: false,
    },
    new_status: {
      type: DataTypes.ENUM("draft", "active", "closed", "suspended", "archived"),
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
    modelName: "ScholarshipStatusLog",
    tableName: "scholarship_status_logs",
    timestamps: false,
  }
);

export default ScholarshipStatusLog;
