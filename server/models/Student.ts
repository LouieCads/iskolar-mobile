import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database"; 
import User from "./Users";

interface StudentAttributes {
  student_id: string;
  user_id: string;
  full_name: string;
  gender?: 'male' | 'female';
  date_of_birth: Date;
  contact_number: string;
  has_completed_profile?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Required Fields
interface StudentCreationAttributes extends Optional<StudentAttributes, "student_id"> {}

class Student extends Model<StudentAttributes, StudentCreationAttributes> implements StudentAttributes {
  public student_id!: string;
  public user_id!: string;
  public full_name!: string;
  public gender?: 'male' | 'female';
  public date_of_birth!: Date;
  public contact_number!: string;
  public has_completed_profile?: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  static associate(models: any) {
    Student.belongsTo(models.User, {
      foreignKey: "user_id",
      as: "user",
    });
    Student.hasMany(models.ScholarshipApplication, {
      foreignKey: "student_id",
      as: "scholarship_applications",
    });
  }
}

Student.init(
  {
    student_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false, 
      references: { 
        model: User,
        key: "user_id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    contact_number: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    has_completed_profile: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Student",
    tableName: "students",
    timestamps: true, 
    createdAt: "created_at", 
    updatedAt: "updated_at",
  }
);

export default Student;
